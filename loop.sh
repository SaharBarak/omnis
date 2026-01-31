#!/bin/bash
# Usage: ./loop.sh [plan] [max_iterations]
# Examples:
#   ./loop.sh              # Build mode, unlimited iterations
#   ./loop.sh 20           # Build mode, max 20 iterations
#   ./loop.sh plan         # Plan mode, unlimited iterations
#   ./loop.sh plan 5       # Plan mode, max 5 iterations

# Parse arguments
if [ "$1" = "plan" ]; then
    # Plan mode
    MODE="plan"
    PROMPT_FILE="PROMPT_plan.md"
    MAX_ITERATIONS=${2:-0}
elif [[ "$1" =~ ^[0-9]+$ ]]; then
    # Build mode with max iterations
    MODE="build"
    PROMPT_FILE="PROMPT_build.md"
    MAX_ITERATIONS=$1
else
    # Build mode, unlimited (no arguments or invalid input)
    MODE="build"
    PROMPT_FILE="PROMPT_build.md"
    MAX_ITERATIONS=0
fi

ITERATION=0
CURRENT_BRANCH=$(git branch --show-current)

# ========== TIMING & METRICS TRACKING ==========
METRICS_CSV="ralph_metrics.csv"
METRICS_JSON="ralph_metrics.jsonl"
TEMP_OUTPUT="/tmp/ralph_output_$$.json"
SESSION_ID=$(date +%Y%m%d_%H%M%S)_$$

# Create CSV with headers if it doesn't exist
if [ ! -f "$METRICS_CSV" ]; then
    cat > "$METRICS_CSV" << 'CSVHEADER'
session_id,iteration,mode,branch,start_time,end_time,duration_seconds,duration_human,input_tokens,output_tokens,cache_read_tokens,cache_write_tokens,cost_cents,tool_calls_total,tool_read,tool_edit,tool_write,tool_bash,tool_glob,tool_grep,tool_task,tool_todo,subagents_spawned,errors_encountered,retries_same_file,tests_run,tests_passed,tests_failed,build_attempted,build_succeeded,files_touched,unique_files,context_window_pct,time_to_first_tool_sec,time_to_first_commit_sec,commit_hash,task_type,task_description,status
CSVHEADER
fi

# Function to format duration as human readable
format_duration() {
    local seconds=$1
    local hours=$((seconds / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))
    if [ $hours -gt 0 ]; then
        echo "${hours}h ${minutes}m ${secs}s"
    elif [ $minutes -gt 0 ]; then
        echo "${minutes}m ${secs}s"
    else
        echo "${secs}s"
    fi
}

# Function to extract comprehensive metrics from Claude stream-json output
extract_claude_metrics() {
    local output_file=$1
    local start_time=$2

    if [ ! -f "$output_file" ]; then
        # Return default values for all metrics
        echo '{"input_tokens":0,"output_tokens":0,"cache_read":0,"cache_write":0,"cost_cents":0,"tool_calls_total":0,"tool_read":0,"tool_edit":0,"tool_write":0,"tool_bash":0,"tool_glob":0,"tool_grep":0,"tool_task":0,"tool_todo":0,"subagents":0,"errors":0,"retries_same_file":0,"tests_run":0,"tests_passed":0,"tests_failed":0,"build_attempted":0,"build_succeeded":0,"files_touched":"","unique_files":0,"context_pct":0,"first_tool_sec":0,"first_commit_sec":0,"task_type":"unknown","task_desc":"No output captured"}'
        return
    fi

    # === TOKEN METRICS ===
    local input_tokens=$(grep -o '"input_tokens":[0-9]*' "$output_file" | tail -1 | grep -o '[0-9]*' || echo "0")
    local output_tokens=$(grep -o '"output_tokens":[0-9]*' "$output_file" | tail -1 | grep -o '[0-9]*' || echo "0")
    local cache_read=$(grep -o '"cache_read_input_tokens":[0-9]*' "$output_file" | tail -1 | grep -o '[0-9]*' || echo "0")
    local cache_write=$(grep -o '"cache_creation_input_tokens":[0-9]*' "$output_file" | tail -1 | grep -o '[0-9]*' || echo "0")

    # Cost calculation (Opus: $15/M input, $75/M output, cache read $1.5/M, cache write $18.75/M)
    local cost_cents=$(echo "scale=2; (${input_tokens:-0} * 15 + ${output_tokens:-0} * 75 + ${cache_read:-0} * 1.5 + ${cache_write:-0} * 18.75) / 10000" | bc 2>/dev/null || echo "0")

    # === TOOL USAGE METRICS ===
    local tool_read=$(grep -c '"tool":"Read"' "$output_file" 2>/dev/null || echo "0")
    local tool_edit=$(grep -c '"tool":"Edit"' "$output_file" 2>/dev/null || echo "0")
    local tool_write=$(grep -c '"tool":"Write"' "$output_file" 2>/dev/null || echo "0")
    local tool_bash=$(grep -c '"tool":"Bash"' "$output_file" 2>/dev/null || echo "0")
    local tool_glob=$(grep -c '"tool":"Glob"' "$output_file" 2>/dev/null || echo "0")
    local tool_grep=$(grep -c '"tool":"Grep"' "$output_file" 2>/dev/null || echo "0")
    local tool_task=$(grep -c '"tool":"Task"' "$output_file" 2>/dev/null || echo "0")
    local tool_todo=$(grep -c '"tool":"TodoWrite"' "$output_file" 2>/dev/null || echo "0")
    local tool_calls_total=$((tool_read + tool_edit + tool_write + tool_bash + tool_glob + tool_grep + tool_task + tool_todo))

    # === SUBAGENT METRICS ===
    local subagents=$tool_task

    # === ERROR METRICS ===
    local errors=$(grep -c '"type":"error"' "$output_file" 2>/dev/null || echo "0")
    errors=$((errors + $(grep -ci 'error\|failed\|exception' "$output_file" 2>/dev/null | head -1 || echo "0")))

    # === RETRY METRICS (same file edited multiple times) ===
    local edited_files=$(grep -o '"file_path":"[^"]*"' "$output_file" 2>/dev/null | sort | uniq -c | awk '$1 > 1 {count++} END {print count+0}')
    local retries_same_file=${edited_files:-0}

    # === TEST METRICS ===
    local tests_run=0
    local tests_passed=0
    local tests_failed=0
    # Parse vitest/jest output
    if grep -q "Tests:" "$output_file" 2>/dev/null; then
        tests_passed=$(grep -o '[0-9]* passed' "$output_file" | tail -1 | grep -o '[0-9]*' || echo "0")
        tests_failed=$(grep -o '[0-9]* failed' "$output_file" | tail -1 | grep -o '[0-9]*' || echo "0")
        tests_run=$((tests_passed + tests_failed))
    fi
    # Parse pytest output
    if grep -q "passed\|failed" "$output_file" 2>/dev/null; then
        local pytest_passed=$(grep -oE '[0-9]+ passed' "$output_file" | tail -1 | grep -o '[0-9]*' || echo "0")
        local pytest_failed=$(grep -oE '[0-9]+ failed' "$output_file" | tail -1 | grep -o '[0-9]*' || echo "0")
        tests_passed=$((tests_passed + pytest_passed))
        tests_failed=$((tests_failed + pytest_failed))
        tests_run=$((tests_run + pytest_passed + pytest_failed))
    fi

    # === BUILD METRICS ===
    local build_attempted=0
    local build_succeeded=0
    if grep -qE 'npm run build|pnpm build|yarn build|tsc|next build' "$output_file" 2>/dev/null; then
        build_attempted=1
        if grep -qE 'Successfully|Compiled|Build completed|✓ Compiled' "$output_file" 2>/dev/null; then
            build_succeeded=1
        fi
    fi

    # === FILE METRICS ===
    local files_touched=$(grep -o '"file_path":"[^"]*"' "$output_file" 2>/dev/null | cut -d'"' -f4 | sort -u | tr '\n' '|' | sed 's/|$//')
    local unique_files=$(grep -o '"file_path":"[^"]*"' "$output_file" 2>/dev/null | cut -d'"' -f4 | sort -u | wc -l | tr -d ' ')

    # === CONTEXT METRICS ===
    # Estimate context usage (200K max for Opus)
    local total_tokens=$((input_tokens + output_tokens))
    local context_pct=$(echo "scale=1; $total_tokens * 100 / 200000" | bc 2>/dev/null || echo "0")

    # === TIMING METRICS ===
    local first_tool_sec=0
    local first_commit_sec=0
    # These would need timestamps in the JSON to calculate accurately
    # For now, estimate based on output patterns

    # === TASK TYPE INFERENCE ===
    local task_type="unknown"
    local commit_msg=$(git log -1 --pretty=%s 2>/dev/null || echo "")
    if echo "$commit_msg" | grep -qiE '^fix|bug|patch|hotfix'; then
        task_type="bugfix"
    elif echo "$commit_msg" | grep -qiE '^feat|add|implement|create'; then
        task_type="feature"
    elif echo "$commit_msg" | grep -qiE '^refactor|clean|reorganize'; then
        task_type="refactor"
    elif echo "$commit_msg" | grep -qiE '^test|spec'; then
        task_type="test"
    elif echo "$commit_msg" | grep -qiE '^doc|readme|comment'; then
        task_type="docs"
    elif echo "$commit_msg" | grep -qiE '^chore|update|upgrade|bump'; then
        task_type="chore"
    fi

    # === TASK DESCRIPTION ===
    local task_desc=""
    # Try TodoWrite content first
    task_desc=$(grep -o '"content":"[^"]*' "$output_file" 2>/dev/null | head -3 | cut -d'"' -f4 | tr '\n' ' ' | head -c 200)
    # Fallback to commit message
    if [ -z "$task_desc" ] || [ ${#task_desc} -lt 10 ]; then
        task_desc="$commit_msg"
    fi
    # Clean for JSON
    task_desc=$(echo "$task_desc" | tr '"' "'" | tr '\n' ' ' | tr '\t' ' ' | head -c 200)

    # Output as JSON for parsing
    cat << JSONEOF
{
  "input_tokens": ${input_tokens:-0},
  "output_tokens": ${output_tokens:-0},
  "cache_read": ${cache_read:-0},
  "cache_write": ${cache_write:-0},
  "cost_cents": ${cost_cents:-0},
  "tool_calls_total": ${tool_calls_total:-0},
  "tool_read": ${tool_read:-0},
  "tool_edit": ${tool_edit:-0},
  "tool_write": ${tool_write:-0},
  "tool_bash": ${tool_bash:-0},
  "tool_glob": ${tool_glob:-0},
  "tool_grep": ${tool_grep:-0},
  "tool_task": ${tool_task:-0},
  "tool_todo": ${tool_todo:-0},
  "subagents": ${subagents:-0},
  "errors": ${errors:-0},
  "retries_same_file": ${retries_same_file:-0},
  "tests_run": ${tests_run:-0},
  "tests_passed": ${tests_passed:-0},
  "tests_failed": ${tests_failed:-0},
  "build_attempted": ${build_attempted:-0},
  "build_succeeded": ${build_succeeded:-0},
  "files_touched": "${files_touched:-}",
  "unique_files": ${unique_files:-0},
  "context_pct": ${context_pct:-0},
  "first_tool_sec": ${first_tool_sec:-0},
  "first_commit_sec": ${first_commit_sec:-0},
  "task_type": "${task_type:-unknown}",
  "task_desc": "${task_desc:-No description}"
}
JSONEOF
}

# Function to get git diff stats
get_diff_stats() {
    local stats=$(git diff --shortstat HEAD~1 HEAD 2>/dev/null || echo "0 files, 0 insertions, 0 deletions")
    local files=$(echo "$stats" | grep -o '[0-9]* file' | grep -o '[0-9]*' || echo "0")
    local added=$(echo "$stats" | grep -o '[0-9]* insertion' | grep -o '[0-9]*' || echo "0")
    local deleted=$(echo "$stats" | grep -o '[0-9]* deletion' | grep -o '[0-9]*' || echo "0")
    echo "${files:-0},${added:-0},${deleted:-0}"
}

# Function to log metrics to CSV and JSONL
log_metrics() {
    local start_time=$1
    local end_time=$2
    local status=$3
    local duration=$((end_time - start_time))
    local duration_human=$(format_duration $duration)
    local commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "none")
    local diff_stats=$(get_diff_stats)
    local files_changed=$(echo "$diff_stats" | cut -d',' -f1)
    local lines_added=$(echo "$diff_stats" | cut -d',' -f2)
    local lines_deleted=$(echo "$diff_stats" | cut -d',' -f3)

    # Extract comprehensive Claude metrics as JSON
    local metrics_json=$(extract_claude_metrics "$TEMP_OUTPUT" "$start_time")

    # Parse JSON fields using grep (portable)
    local input_tokens=$(echo "$metrics_json" | grep -o '"input_tokens": *[0-9]*' | grep -o '[0-9]*')
    local output_tokens=$(echo "$metrics_json" | grep -o '"output_tokens": *[0-9]*' | grep -o '[0-9]*')
    local cache_read=$(echo "$metrics_json" | grep -o '"cache_read": *[0-9]*' | grep -o '[0-9]*')
    local cache_write=$(echo "$metrics_json" | grep -o '"cache_write": *[0-9]*' | grep -o '[0-9]*')
    local cost_cents=$(echo "$metrics_json" | grep -o '"cost_cents": *[0-9.]*' | grep -o '[0-9.]*')
    local tool_calls_total=$(echo "$metrics_json" | grep -o '"tool_calls_total": *[0-9]*' | grep -o '[0-9]*')
    local tool_read=$(echo "$metrics_json" | grep -o '"tool_read": *[0-9]*' | grep -o '[0-9]*')
    local tool_edit=$(echo "$metrics_json" | grep -o '"tool_edit": *[0-9]*' | grep -o '[0-9]*')
    local tool_write=$(echo "$metrics_json" | grep -o '"tool_write": *[0-9]*' | grep -o '[0-9]*')
    local tool_bash=$(echo "$metrics_json" | grep -o '"tool_bash": *[0-9]*' | grep -o '[0-9]*')
    local tool_glob=$(echo "$metrics_json" | grep -o '"tool_glob": *[0-9]*' | grep -o '[0-9]*')
    local tool_grep=$(echo "$metrics_json" | grep -o '"tool_grep": *[0-9]*' | grep -o '[0-9]*')
    local tool_task=$(echo "$metrics_json" | grep -o '"tool_task": *[0-9]*' | grep -o '[0-9]*')
    local tool_todo=$(echo "$metrics_json" | grep -o '"tool_todo": *[0-9]*' | grep -o '[0-9]*')
    local subagents=$(echo "$metrics_json" | grep -o '"subagents": *[0-9]*' | grep -o '[0-9]*')
    local errors=$(echo "$metrics_json" | grep -o '"errors": *[0-9]*' | grep -o '[0-9]*')
    local retries_same_file=$(echo "$metrics_json" | grep -o '"retries_same_file": *[0-9]*' | grep -o '[0-9]*')
    local tests_run=$(echo "$metrics_json" | grep -o '"tests_run": *[0-9]*' | grep -o '[0-9]*')
    local tests_passed=$(echo "$metrics_json" | grep -o '"tests_passed": *[0-9]*' | grep -o '[0-9]*')
    local tests_failed=$(echo "$metrics_json" | grep -o '"tests_failed": *[0-9]*' | grep -o '[0-9]*')
    local build_attempted=$(echo "$metrics_json" | grep -o '"build_attempted": *[0-9]*' | grep -o '[0-9]*')
    local build_succeeded=$(echo "$metrics_json" | grep -o '"build_succeeded": *[0-9]*' | grep -o '[0-9]*')
    local unique_files=$(echo "$metrics_json" | grep -o '"unique_files": *[0-9]*' | grep -o '[0-9]*')
    local context_pct=$(echo "$metrics_json" | grep -o '"context_pct": *[0-9.]*' | grep -o '[0-9.]*')
    local first_tool_sec=$(echo "$metrics_json" | grep -o '"first_tool_sec": *[0-9]*' | grep -o '[0-9]*')
    local first_commit_sec=$(echo "$metrics_json" | grep -o '"first_commit_sec": *[0-9]*' | grep -o '[0-9]*')
    local task_type=$(echo "$metrics_json" | grep -o '"task_type": *"[^"]*"' | cut -d'"' -f4)
    local task_desc=$(echo "$metrics_json" | grep -o '"task_desc": *"[^"]*"' | cut -d'"' -f4 | tr ',' ';')
    local files_touched=$(echo "$metrics_json" | grep -o '"files_touched": *"[^"]*"' | cut -d'"' -f4)

    # Write to CSV
    echo "$SESSION_ID,$ITERATION,$MODE,$CURRENT_BRANCH,$start_time,$end_time,$duration,$duration_human,${input_tokens:-0},${output_tokens:-0},${cache_read:-0},${cache_write:-0},${cost_cents:-0},${tool_calls_total:-0},${tool_read:-0},${tool_edit:-0},${tool_write:-0},${tool_bash:-0},${tool_glob:-0},${tool_grep:-0},${tool_task:-0},${tool_todo:-0},${subagents:-0},${errors:-0},${retries_same_file:-0},${tests_run:-0},${tests_passed:-0},${tests_failed:-0},${build_attempted:-0},${build_succeeded:-0},\"$files_touched\",${unique_files:-0},${context_pct:-0},${first_tool_sec:-0},${first_commit_sec:-0},$commit_hash,${task_type:-unknown},\"$task_desc\",$status" >> "$METRICS_CSV"

    # Write full JSON to JSONL for detailed analysis
    cat >> "$METRICS_JSON" << JSONLEOF
{"session_id":"$SESSION_ID","iteration":$ITERATION,"mode":"$MODE","branch":"$CURRENT_BRANCH","start_time":$start_time,"end_time":$end_time,"duration_seconds":$duration,"duration_human":"$duration_human","commit_hash":"$commit_hash","git_files_changed":$files_changed,"git_lines_added":$lines_added,"git_lines_deleted":$lines_deleted,"status":"$status",$(echo "$metrics_json" | tr -d '\n' | sed 's/^{//' | sed 's/}$//')}
JSONLEOF

    # Calculate cost in dollars
    local cost_dollars=$(echo "scale=2; ${cost_cents:-0} / 100" | bc 2>/dev/null || echo "0.00")

    # Display metrics
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 ITERATION $ITERATION METRICS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "%-20s %-20s %-20s %-20s\n" "Duration:" "$duration_human" "Context:" "${context_pct:-0}%"
    printf "%-20s %-20s %-20s %-20s\n" "Input tokens:" "${input_tokens:-0}" "Cache read:" "${cache_read:-0}"
    printf "%-20s %-20s %-20s %-20s\n" "Output tokens:" "${output_tokens:-0}" "Cache write:" "${cache_write:-0}"
    printf "%-20s %-20s %-20s %-20s\n" "Cost:" "\$$cost_dollars" "Task type:" "${task_type:-unknown}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "%-20s %-10s %-10s %-10s %-10s %-10s %-10s %-10s\n" "Tools:" "Read:${tool_read:-0}" "Edit:${tool_edit:-0}" "Write:${tool_write:-0}" "Bash:${tool_bash:-0}" "Glob:${tool_glob:-0}" "Grep:${tool_grep:-0}" "Task:${tool_task:-0}"
    printf "%-20s %-20s %-20s %-20s\n" "Subagents:" "${subagents:-0}" "Errors:" "${errors:-0}"
    printf "%-20s %-20s %-20s %-20s\n" "Retries:" "${retries_same_file:-0}" "Files touched:" "${unique_files:-0}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "${tests_run:-0}" -gt 0 ]; then
        printf "%-20s %-20s %-20s %-20s\n" "Tests:" "Run:${tests_run}" "Passed:${tests_passed:-0}" "Failed:${tests_failed:-0}"
    fi
    if [ "${build_attempted:-0}" -gt 0 ]; then
        local build_status="FAILED"
        [ "${build_succeeded:-0}" -eq 1 ] && build_status="SUCCESS"
        printf "%-20s %-20s\n" "Build:" "$build_status"
    fi
    printf "%-20s %-20s\n" "Commit:" "$commit_hash"
    printf "%-20s %-20s\n" "Status:" "$status"
    echo "Task: ${task_desc:0:70}..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}
# ===============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Mode:      $MODE"
echo "Prompt:    $PROMPT_FILE"
echo "Branch:    $CURRENT_BRANCH"
echo "Session:   $SESSION_ID"
echo "Metrics:   $METRICS_CSV"
[ $MAX_ITERATIONS -gt 0 ] && echo "Max:       $MAX_ITERATIONS iterations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Trap for cleanup on exit - track cumulative totals
SESSION_START_TIME=$(date +%s)

cleanup() {
    SESSION_END_TIME=$(date +%s)
    SESSION_DURATION=$((SESSION_END_TIME - SESSION_START_TIME))
    SESSION_DURATION_HUMAN=$(format_duration $SESSION_DURATION)

    # Calculate session totals from CSV (columns based on new header)
    local total_input=0 total_output=0 total_cache_read=0 total_cache_write=0 total_cost=0
    local total_tool_calls=0 total_subagents=0 total_errors=0 total_retries=0
    local total_tests_run=0 total_tests_passed=0 total_tests_failed=0
    local total_builds=0 total_builds_passed=0 total_files=0

    if [ -f "$METRICS_CSV" ]; then
        total_input=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$9} END {print sum+0}')
        total_output=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$10} END {print sum+0}')
        total_cache_read=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$11} END {print sum+0}')
        total_cache_write=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$12} END {print sum+0}')
        total_cost=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$13} END {print sum+0}')
        total_tool_calls=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$14} END {print sum+0}')
        total_subagents=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$23} END {print sum+0}')
        total_errors=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$24} END {print sum+0}')
        total_retries=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$25} END {print sum+0}')
        total_tests_run=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$26} END {print sum+0}')
        total_tests_passed=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$27} END {print sum+0}')
        total_tests_failed=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$28} END {print sum+0}')
        total_builds=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$29} END {print sum+0}')
        total_builds_passed=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$30} END {print sum+0}')
        total_files=$(grep "^$SESSION_ID," "$METRICS_CSV" | awk -F',' '{sum+=$32} END {print sum+0}')
    fi

    local total_cost_dollars=$(echo "scale=2; $total_cost / 100" | bc 2>/dev/null || echo "0.00")
    local cache_savings=$(echo "scale=2; $total_cache_read * 13.5 / 10000" | bc 2>/dev/null || echo "0.00")
    local avg_duration=0
    [ $ITERATION -gt 0 ] && avg_duration=$((SESSION_DURATION / ITERATION))
    local avg_duration_human=$(format_duration $avg_duration)
    local test_pass_rate=0
    [ $total_tests_run -gt 0 ] && test_pass_rate=$(echo "scale=1; $total_tests_passed * 100 / $total_tests_run" | bc 2>/dev/null || echo "0")
    local build_pass_rate=0
    [ $total_builds -gt 0 ] && build_pass_rate=$(echo "scale=1; $total_builds_passed * 100 / $total_builds" | bc 2>/dev/null || echo "0")

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 SESSION SUMMARY: $SESSION_ID"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "%-25s %-25s %-25s\n" "Iterations: $ITERATION" "Total Duration: $SESSION_DURATION_HUMAN" "Avg/Iteration: $avg_duration_human"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "💰 COST ANALYSIS"
    printf "%-25s %-25s %-25s\n" "Input tokens: $total_input" "Output tokens: $total_output" "Total cost: \$$total_cost_dollars"
    printf "%-25s %-25s %-25s\n" "Cache read: $total_cache_read" "Cache write: $total_cache_write" "Cache savings: ~\$$cache_savings"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 PRODUCTIVITY"
    printf "%-25s %-25s %-25s\n" "Tool calls: $total_tool_calls" "Subagents: $total_subagents" "Files touched: $total_files"
    printf "%-25s %-25s\n" "Errors: $total_errors" "Retries (same file): $total_retries"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ QUALITY"
    printf "%-25s %-25s %-25s\n" "Tests run: $total_tests_run" "Passed: $total_tests_passed" "Failed: $total_tests_failed"
    printf "%-25s %-25s %-25s\n" "Test pass rate: ${test_pass_rate}%" "Builds: $total_builds" "Build pass rate: ${build_pass_rate}%"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📁 OUTPUT FILES"
    printf "%-40s %s\n" "CSV (spreadsheet):" "$METRICS_CSV"
    printf "%-40s %s\n" "JSONL (detailed):" "$METRICS_JSON"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Clean up temp file
    rm -f "$TEMP_OUTPUT"
}
trap cleanup EXIT

# Verify prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: $PROMPT_FILE not found"
    exit 1
fi

# Test git push capability before starting loop
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing git push capability..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test SSH connection to GitHub
if ! ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "❌ ERROR: Cannot authenticate with GitHub via SSH"
    echo "Please check:"
    echo "  1. SSH keys are properly mounted (Docker)"
    echo "  2. SSH keys exist at ~/.ssh/id_rsa (Local)"
    echo "  3. GitHub knows your public key"
    exit 1
fi
echo "✓ SSH authentication to GitHub works"

# Test git push
if git push origin "$CURRENT_BRANCH" 2>&1; then
    echo "✓ Git push test successful"
else
    echo "❌ ERROR: Git push failed"
    echo "Cannot proceed with Ralph loop if push doesn't work"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "All pre-flight checks passed! Starting loop..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while true; do
    if [ $MAX_ITERATIONS -gt 0 ] && [ $ITERATION -ge $MAX_ITERATIONS ]; then
        echo "Reached max iterations: $MAX_ITERATIONS"
        break
    fi

    ITERATION=$((ITERATION + 1))
    echo -e "\n\n======================== LOOP $ITERATION ========================\n"

    # Record start time
    START_TIME=$(date +%s)
    START_DATETIME=$(date '+%Y-%m-%d %H:%M:%S')
    echo "🕐 Started at: $START_DATETIME"

    # Run Ralph iteration with selected prompt
    # -p: Headless mode (non-interactive, reads from stdin)
    # --dangerously-skip-permissions: Auto-approve all tool calls (YOLO mode)
    # --output-format=stream-json: Structured output for logging/monitoring
    # --model opus: Primary agent uses Opus for complex reasoning (task selection, prioritization)
    # --verbose: Detailed execution logging
    # Capture output for metrics while still displaying it
    CLAUDE_EXIT_CODE=0
    cat "$PROMPT_FILE" | claude -p \
        --dangerously-skip-permissions \
        --output-format=stream-json \
        --model opus \
        --verbose 2>&1 | tee "$TEMP_OUTPUT" || CLAUDE_EXIT_CODE=$?

    # Record end time
    END_TIME=$(date +%s)
    END_DATETIME=$(date '+%Y-%m-%d %H:%M:%S')
    DURATION=$((END_TIME - START_TIME))
    echo "🕐 Finished at: $END_DATETIME (duration: $(format_duration $DURATION))"

    # Set status
    if [ $CLAUDE_EXIT_CODE -eq 0 ]; then
        STATUS="success"
    else
        STATUS="error:$CLAUDE_EXIT_CODE"
    fi

    # Push changes after each iteration
    git push origin "$CURRENT_BRANCH" || {
        echo "Failed to push. Creating remote branch..."
        git push -u origin "$CURRENT_BRANCH"
    }

    # Log metrics to CSV
    log_metrics $START_TIME $END_TIME $STATUS

    # Cleanup temp file
    rm -f "$TEMP_OUTPUT"

    # Brief pause between iterations to avoid hammering API
    echo "⏳ Brief pause (5s) before next iteration..."
    sleep 5
done
