import { Select } from '../../primitives/select';
import { Field } from '../../form/field';
import { Group } from '../../layout/group';
import type { WidgetComponentProps } from '../types';
import { LinkWidget } from './link-widget';

export function DynamicLinkWidget({ props, bind, on, context }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const models = (props.models as Array<{ value: string; label: string }>) ?? [];
  const modelField = (props.modelField as string) ?? '_type';

  const currentModel = (context.record[modelField] as string) ?? '';

  const handleModelChange = (value: string | null) => {
    on.modelChange?.(value);
    bind.setValue?.(null);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <Group direction="row" gap="sm">
        <Select value={currentModel} onValueChange={handleModelChange} disabled={disabled}>
          <Select.Trigger className="w-32">
            <Select.Value placeholder="Type..." />
          </Select.Trigger>
          <Select.Content>
            {models.map((m) => (
              <Select.Item key={m.value} value={m.value}>
                {m.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <LinkWidget props={{ ...props, label: undefined }} bind={bind} on={on} context={context} />
      </Group>
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

DynamicLinkWidget.displayName = 'DynamicLinkWidget';
