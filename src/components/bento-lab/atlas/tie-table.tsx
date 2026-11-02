import { Fragment, type ReactNode } from "react";
import { mayDrawEdge } from "@pleiad/engine/services/rarity";
import a from "./atlas.module.css";
import { TIE_LAYER } from "./tie-geometry";
import site from "../site/site.module.css";
import {
  centerName,
  type PairReading,
  type Tie,
} from "@/lib/relations/pair-ties";
import {
  SYSTEM_LABEL,
  tieBetween,
  tieBits,
  tieName,
  tieOdds,
} from "@/lib/relations/tie-text";

/** One drawn tie's row, for a caller that presents rows its own way. */
export interface TieRowSlot {
  readonly tie: Tie;
  /** Rank among the drawn ties, rarest first. */
  readonly index: number;
  /** The row's cells, to sit inside the caller's own row element. */
  readonly cells: ReactNode;
}

/**
 * Presentation hooks for the drawn ties. The table's text, columns and
 * order never change; a caller only wraps the row (to settle it in) or the
 * weight (to roll it).
 */
export interface TieRowHooks {
  readonly row?: (slot: TieRowSlot) => ReactNode;
  readonly bits?: (tie: Tie, index: number) => ReactNode;
}

const tieKey = (t: Tie, i: number): string =>
  `${t.system}-${t.type}-${t.channel ?? ""}-${i}`;

function Cells({
  tie: t,
  index,
  name,
  hooks,
}: {
  tie: Tie;
  index: number;
  name: (id: string) => string;
  hooks: TieRowHooks;
}) {
  return (
    <>
      <td>
        <span className={site.chip}>
          <span
            className={a.swatch}
            data-layer={TIE_LAYER[t.system]}
            aria-hidden
          />
          {SYSTEM_LABEL[t.system]}
        </span>
      </td>
      <td>
        <strong style={{ color: "var(--lab-ink)", fontWeight: 600 }}>
          {tieName(t, centerName)}
        </strong>
        <br />
        {tieBetween(t, name)}. {t.meaning}
      </td>
      <td className={site.num}>{tieOdds(t.baseRate)}</td>
      <td className={site.num}>
        {hooks.bits ? hooks.bits(t, index) : tieBits(t.bits)}
      </td>
    </>
  );
}

function Rows({
  ties,
  name,
  hooks = {},
}: {
  ties: readonly Tie[];
  name: (id: string) => string;
  hooks?: TieRowHooks;
}) {
  return (
    <>
      {ties.map((t, i) => {
        const cells = <Cells tie={t} index={i} name={name} hooks={hooks} />;
        return hooks.row ? (
          <Fragment key={tieKey(t, i)}>
            {hooks.row({ tie: t, index: i, cells })}
          </Fragment>
        ) : (
          <tr key={tieKey(t, i)}>{cells}</tr>
        );
      })}
    </>
  );
}

/** The caption sits above the scroll box as a heading, so it never scrolls with the columns or crowds the header row. */
function Table({
  ties,
  name,
  caption,
  headingId,
  hooks,
}: {
  ties: readonly Tie[];
  name: (id: string) => string;
  caption: string;
  headingId: string;
  hooks?: TieRowHooks;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h3 id={headingId} className={a.readoutHead} style={{ margin: 0 }}>
        {caption}
      </h3>
      <div className={site.tableScroll}>
        <table className={site.table} aria-labelledby={headingId}>
          <thead>
            <tr>
              <th scope="col">System</th>
              <th scope="col">Tie</th>
              <th scope="col">How often</th>
              <th scope="col">Weight</th>
            </tr>
          </thead>
          <tbody>
            <Rows ties={ties} name={name} hooks={hooks} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * The pair as text: drawn ties first, then the common ones folded away.
 * Odds are the measured share of random pairs with that tie.
 */
export function TieTable({
  reading,
  names,
  id,
  className,
  drawnRows,
}: {
  readonly reading: PairReading;
  readonly names: Readonly<Record<string, string>>;
  readonly id?: string;
  readonly className?: string;
  /** Presentation hooks for the drawn rows (a scene settling them in). */
  readonly drawnRows?: TieRowHooks;
}) {
  const name = (pid: string) => names[pid] ?? pid;
  const base = id ?? "tie-table";
  const drawn = reading.ties.filter((t) => mayDrawEdge(t.baseRate));
  const common = reading.ties.filter((t) => !mayDrawEdge(t.baseRate));
  return (
    <div
      id={id}
      className={[a.tokens, className].filter(Boolean).join(" ")}
      style={{ display: "grid", gap: 12 }}
    >
      {drawn.length > 0 ? (
        <Table
          ties={drawn}
          name={name}
          caption="Ties on the map"
          headingId={`${base}-drawn`}
          hooks={drawnRows}
        />
      ) : (
        <p className={site.body}>
          No tie between these two is rare enough to draw. That is a result too:
          most pairs share only common ties.
        </p>
      )}
      {common.length > 0 && (
        <details className={a.common}>
          <summary>
            {common.length} common {common.length === 1 ? "tie" : "ties"}, true
            for most pairs
          </summary>
          <Table
            ties={common}
            name={name}
            caption="Common ties"
            headingId={`${base}-common`}
          />
        </details>
      )}
    </div>
  );
}
