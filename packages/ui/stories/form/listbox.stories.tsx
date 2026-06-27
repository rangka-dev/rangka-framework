import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Listbox } from '../../src/form/listbox';
import { Icon } from '../../src/primitives/icon';

const meta: Meta = {
  title: 'Form/Listbox',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'dragonfruit', label: 'Dragonfruit' },
  { value: 'elderberry', label: 'Elderberry' },
];

export const Basic: Story = {
  name: 'Basic Select',
  render: function Demo() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    const selected = options.find((o) => o.value === value);

    return (
      <Listbox className="w-64">
        <Listbox.Trigger onClick={() => setOpen(!open)} placeholder={!selected}>
          <Listbox.TriggerValue>
            {selected ? selected.label : 'Select fruit...'}
          </Listbox.TriggerValue>
          <Listbox.TriggerIcon>
            <Icon icon={ChevronDown} size="sm" />
          </Listbox.TriggerIcon>
        </Listbox.Trigger>
        {open && (
          <Listbox.Content>
            <Listbox.Items>
              {options.map((opt) => (
                <Listbox.Item
                  key={opt.value}
                  active={opt.value === value}
                  onClick={() => {
                    setValue(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </Listbox.Item>
              ))}
            </Listbox.Items>
          </Listbox.Content>
        )}
      </Listbox>
    );
  },
};

export const WithSearch: Story = {
  name: 'With Search',
  render: function Demo() {
    const [open, setOpen] = useState(true);
    const [value, setValue] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
    const selected = options.find((o) => o.value === value);

    return (
      <Listbox className="w-64">
        <Listbox.Trigger onClick={() => setOpen(!open)} placeholder={!selected}>
          <Listbox.TriggerValue>{selected ? selected.label : 'Search...'}</Listbox.TriggerValue>
          <Listbox.TriggerIcon>
            <Icon icon={Search} size="sm" />
          </Listbox.TriggerIcon>
        </Listbox.Trigger>
        {open && (
          <Listbox.Content>
            <Listbox.Search
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fruits..."
            />
            <Listbox.Items>
              {filtered.length === 0 && <Listbox.Empty />}
              {filtered.map((opt) => (
                <Listbox.Item
                  key={opt.value}
                  active={opt.value === value}
                  onClick={() => {
                    setValue(opt.value);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {opt.label}
                </Listbox.Item>
              ))}
            </Listbox.Items>
          </Listbox.Content>
        )}
      </Listbox>
    );
  },
};

export const Empty: Story = {
  name: 'Empty State',
  render: () => (
    <Listbox className="w-64">
      <Listbox.Trigger placeholder>
        <Listbox.TriggerValue>Select...</Listbox.TriggerValue>
        <Listbox.TriggerIcon>
          <Icon icon={ChevronDown} size="sm" />
        </Listbox.TriggerIcon>
      </Listbox.Trigger>
      <Listbox.Content>
        <Listbox.Items>
          <Listbox.Empty>No options available</Listbox.Empty>
        </Listbox.Items>
      </Listbox.Content>
    </Listbox>
  ),
};
