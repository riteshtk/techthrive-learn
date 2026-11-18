"use client";

import { useState } from "react";
import {
  Button,
  ButtonLink,
  Chip,
  FilterGroup,
  Kbd,
  Range,
  StatusPill,
  StatusText,
  TextInput,
} from "@/components/ui/controls";
import {
  ActionRow,
  CheckListItem,
  EmptyState,
  FactChangeItem,
  FootNote,
  HowStep,
  IconSquare,
  LegendDot,
  LiveDot,
  OrderedSteps,
  PageHeader,
  ProgressBar,
  RuleItem,
  StatCard,
} from "@/components/ui/display";
import { SegmentedTabs, tabPanelProps } from "@/components/ui/SegmentedTabs";
import {
  CardLarge,
  DotField,
  Panel2,
  Tile,
  Tint,
  Well,
} from "@/components/ui/surfaces";

const TABS = [
  { value: "explain", label: "Explain" },
  { value: "sources", label: "Sources" },
] as const;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "planned", label: "Planned" },
] as const;

export function Kit() {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("explain");
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]["value"]>("all");
  const [range, setRange] = useState(20);

  return (
    <main className="tt-page">
      <PageHeader
        eyebrow="Design system"
        title="Component kit"
        lede="Every component in the library, in the current theme."
        actions={<StatCard label="Due" value="14" />}
      />

      <CardLarge as="section" aria-labelledby="kit-controls">
        <h2 id="kit-controls" className="tt-h3">
          Controls
        </h2>
        <div className="kit-row">
          <Button>Default</Button>
          <Button variant="primary" trailingIcon="arrow-right">
            Primary
          </Button>
          <Button variant="live">Live</Button>
          <Button variant="ghost" size="sm">
            Ghost small
          </Button>
          <Button
            iconOnly
            size="sm"
            variant="ghost"
            icon="sun"
            aria-label="Sun"
          />
          <ButtonLink href="/" icon="home">
            Home link
          </ButtonLink>
          <Chip>Chip</Chip>
          <Chip on>Chip on</Chip>
          <Chip compact>Compact</Chip>
          <StatusPill tone="cyan">Updated</StatusPill>
          <StatusPill tone="green">No change</StatusPill>
          <StatusPill tone="amber">Refresh</StatusPill>
          <StatusText tone="red">Overdue</StatusText>
          <Kbd>⌘K</Kbd>
        </div>
        <FilterGroup
          label="Status"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
        <TextInput label="Search topics" icon="search" placeholder="Search" />
        <Range
          label="Conversations a day, thousands"
          min={5}
          max={100}
          value={range}
          onChange={(e) => setRange(Number(e.target.value))}
        />
        <SegmentedTabs
          label="Lesson panel"
          idBase="kit-tabs"
          items={TABS}
          value={tab}
          onChange={setTab}
        />
        <div {...tabPanelProps("kit-tabs", tab)}>
          <p className="tt-body-s">Panel: {tab}</p>
        </div>
      </CardLarge>

      <section aria-labelledby="kit-display" className="kit-grid">
        <h2 id="kit-display" className="tt-h3">
          Display
        </h2>
        <Tile>
          <ProgressBar label="Lesson progress" value={5} max={10} />
          <ActionRow href="/" variant="resume">
            <span className="tt-h4">Resume card</span>
          </ActionRow>
          <ActionRow>
            <IconSquare icon="repeat" />
            <span>Action row</span>
          </ActionRow>
        </Tile>
        <Well>
          <ul className="kit-list">
            <FactChangeItem
              status="Updated"
              tone="cyan"
              text="A fact changed."
              source="Source · 1 Nov 2026"
            />
            <FactChangeItem
              status="No change"
              tone="green"
              text="A fact was re-checked."
              source="Source · 2 Nov 2026"
            />
          </ul>
        </Well>
        <Panel2>
          <OrderedSteps
            steps={[
              { key: "a", done: true, content: "First step" },
              { key: "b", content: "Second step" },
            ]}
          />
        </Panel2>
        <RuleItem title="A rule" detail="Its detail" />
        <HowStep n={1}>A how-it-works step</HowStep>
        <ul className="kit-list">
          <CheckListItem>Checked item</CheckListItem>
        </ul>
        <Tint tone="violet">
          <p className="tt-body-s">Tinted callout</p>
        </Tint>
        <DotField className="kit-field">
          <LiveDot /> <LegendDot tone="cyan" /> <LegendDot tone="violet" />
        </DotField>
        <EmptyState title="No topics match">Try another word.</EmptyState>
      </section>
      <FootNote>Sample content for checks only.</FootNote>
    </main>
  );
}
