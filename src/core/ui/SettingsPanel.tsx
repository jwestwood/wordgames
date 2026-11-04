import { useId, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { IconCog } from './Icons';
import { sound } from '../audio/hooks';
import type { SettingDefinition, SettingValue } from '../settings/schema';
import { useGameSettings } from '../settings/hooks';

export interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  definitions: readonly SettingDefinition[];
  values: Record<string, SettingValue>;
  onChange: (key: string, value: SettingValue) => void;
  onReset: () => void;
}

function Row({
  d,
  value,
  onChange,
}: {
  d: SettingDefinition;
  value: SettingValue;
  onChange: (v: SettingValue) => void;
}) {
  const id = useId();
  const desc = d.description ? `${id}-desc` : undefined;
  return (
    <div className={`settings__row settings__row--${d.type}`}>
      <div className="settings__text">
        <label className="settings__label" htmlFor={id}>
          {d.label}
        </label>
        {d.description && (
          <p id={desc} className="settings__desc">
            {d.description}
          </p>
        )}
      </div>
      {d.type === 'toggle' && (
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={value === true}
          aria-describedby={desc}
          className="switch"
          onClick={() => {
            sound.play(value ? 'clear' : 'tap');
            onChange(!value);
          }}
        >
          <span className="switch__track" aria-hidden="true">
            <span className="switch__knob" />
          </span>
          <span className="switch__state">{value ? 'On' : 'Off'}</span>
        </button>
      )}
      {d.type === 'select' && (
        <select
          id={id}
          className="settings__select"
          aria-describedby={desc}
          value={String(value)}
          onChange={(e) => {
            sound.play('tap');
            onChange(e.target.value);
          }}
        >
          {d.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {d.type === 'range' && (
        <div className="settings__range">
          <input
            id={id}
            type="range"
            min={d.min}
            max={d.max}
            step={d.step ?? 'any'}
            value={Number(value)}
            aria-describedby={desc}
            aria-valuetext={d.format ? d.format(Number(value)) : undefined}
            onChange={(e) => {
              sound.play('tap');
              onChange(Number(e.target.value));
            }}
          />
          <output htmlFor={id} className="settings__value">
            {d.format ? d.format(Number(value)) : String(value)}
          </output>
        </div>
      )}
    </div>
  );
}

/** Modal settings form rendered from a definitions schema (see src/core/settings). */
export function SettingsPanel({
  open,
  onClose,
  title = 'Settings',
  definitions,
  values,
  onChange,
  onReset,
}: SettingsPanelProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className="settings"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              sound.play('clear');
              onReset();
            }}
          >
            Reset to defaults
          </Button>
          <Button
            onClick={() => {
              sound.play('button');
              onClose();
            }}
          >
            Done
          </Button>
        </>
      }
    >
      <div className="settings__list">
        {definitions.map((d) => (
          <Row key={d.key} d={d} value={values[d.key]} onChange={(v) => onChange(d.key, v)} />
        ))}
      </div>
    </Modal>
  );
}

/** Cog button + persisted SettingsPanel for a game; renders nothing if there are no settings. */
export function GameSettingsButton({
  gameId,
  definitions,
  title,
}: {
  gameId: string;
  definitions?: readonly SettingDefinition[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const s = useGameSettings(gameId, definitions ?? []);
  if (!definitions?.length) return null;
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="btn--icon settings-btn"
        aria-label="Game settings"
        aria-haspopup="dialog"
        title="Settings"
        onClick={() => setOpen(true)}
      >
        <IconCog />
      </Button>
      <SettingsPanel
        open={open}
        onClose={() => setOpen(false)}
        title={title ?? 'Settings'}
        definitions={definitions}
        values={s.values as Record<string, SettingValue>}
        onChange={(k, v) => (s.set as (k: string, v: SettingValue) => void)(k, v)}
        onReset={s.reset}
      />
    </>
  );
}
