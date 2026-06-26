import type { Meta, StoryObj } from '@storybook/react';
import {
  GroupWidget,
  GridWidget,
  CardWidget,
  StackWidget,
  SectionWidget,
  DividerWidget,
  SpacerWidget,
} from '../../src/widgets/layout';
import { InputWidget } from '../../src/widgets/input';
import { TextWidget } from '../../src/widgets/display';
import { ButtonWidget } from '../../src/widgets/action';
import type { WidgetComponentProps } from '../../src/widgets/types';
import { Card } from '../../src/layout/card';

const meta: Meta = {
  title: 'Widgets/Layout',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const defaultOn = {};
const defaultContext = { record: {}, model: 'test', mode: 'edit' as const };

export const GroupLayout: Story = {
  name: 'Group Widget',
  render: () => (
    <Card>
      <Card.Content>
        <GroupWidget
          props={{ direction: 'row', gap: 'md', align: 'center' }}
          bind={{ value: null }}
          on={defaultOn}
          context={defaultContext}
        >
          <ButtonWidget
            props={{ label: 'Save', variant: 'primary', size: 'sm' }}
            bind={{ value: null }}
            on={defaultOn}
            context={defaultContext}
          />
          <ButtonWidget
            props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
            bind={{ value: null }}
            on={defaultOn}
            context={defaultContext}
          />
          <ButtonWidget
            props={{ label: 'Delete', variant: 'destructive', size: 'sm' }}
            bind={{ value: null }}
            on={defaultOn}
            context={defaultContext}
          />
        </GroupWidget>
      </Card.Content>
    </Card>
  ),
};

export const GridLayout: Story = {
  name: 'Grid Widget',
  render: () => (
    <GridWidget
      props={{ columns: 2, gap: 'md' }}
      bind={{ value: null }}
      on={defaultOn}
      context={defaultContext}
    >
      <InputWidget
        props={{ label: 'First Name', placeholder: 'John' }}
        bind={{
          value: '',
          meta: { type: 'string', label: 'First Name', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <InputWidget
        props={{ label: 'Last Name', placeholder: 'Doe' }}
        bind={{
          value: '',
          meta: { type: 'string', label: 'Last Name', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <InputWidget
        props={{ label: 'Email', placeholder: 'john@example.com' }}
        bind={{
          value: '',
          meta: { type: 'string', label: 'Email', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <InputWidget
        props={{ label: 'Phone', placeholder: '+1 234 567 890' }}
        bind={{
          value: '',
          meta: { type: 'string', label: 'Phone', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </GridWidget>
  ),
};

export const CardLayout: Story = {
  name: 'Card Widget',
  render: () => (
    <GridWidget
      props={{ columns: 3, gap: 'md' }}
      bind={{ value: null }}
      on={defaultOn}
      context={defaultContext}
    >
      <CardWidget
        props={{ title: 'Total Orders', description: 'This month' }}
        bind={{ value: null }}
        on={defaultOn}
        context={defaultContext}
      >
        <TextWidget
          props={{ variant: 'heading' }}
          bind={{ value: '142' }}
          on={defaultOn}
          context={defaultContext}
        />
      </CardWidget>
      <CardWidget
        props={{ title: 'Revenue', description: 'This month' }}
        bind={{ value: null }}
        on={defaultOn}
        context={defaultContext}
      >
        <TextWidget
          props={{ variant: 'heading' }}
          bind={{ value: '$48,250' }}
          on={defaultOn}
          context={defaultContext}
        />
      </CardWidget>
      <CardWidget
        props={{ title: 'Pending', description: 'Requires action' }}
        bind={{ value: null }}
        on={defaultOn}
        context={defaultContext}
      >
        <TextWidget
          props={{ variant: 'heading' }}
          bind={{ value: '7' }}
          on={defaultOn}
          context={defaultContext}
        />
      </CardWidget>
    </GridWidget>
  ),
};

export const StackLayout: Story = {
  name: 'Stack Widget',
  render: () => (
    <Card>
      <Card.Content>
        <StackWidget
          props={{ gap: 'md' }}
          bind={{ value: null }}
          on={defaultOn}
          context={defaultContext}
        >
          <InputWidget
            props={{ label: 'Company Name' }}
            bind={{
              value: '',
              meta: { type: 'string', label: 'Company Name', required: true, readOnly: false },
            }}
            on={defaultOn}
            context={defaultContext}
          />
          <InputWidget
            props={{ label: 'Address' }}
            bind={{
              value: '',
              meta: { type: 'string', label: 'Address', required: false, readOnly: false },
            }}
            on={defaultOn}
            context={defaultContext}
          />
          <InputWidget
            props={{ label: 'City' }}
            bind={{
              value: '',
              meta: { type: 'string', label: 'City', required: false, readOnly: false },
            }}
            on={defaultOn}
            context={defaultContext}
          />
        </StackWidget>
      </Card.Content>
    </Card>
  ),
};

export const SectionLayout: Story = {
  name: 'Section Widget (Collapsible)',
  render: () => (
    <Card>
      <Card.Content>
        <StackWidget
          props={{ gap: 'sm' }}
          bind={{ value: null }}
          on={defaultOn}
          context={defaultContext}
        >
          <SectionWidget
            props={{ label: 'Basic Information', collapsible: true }}
            bind={{ value: null }}
            on={defaultOn}
            context={defaultContext}
          >
            <GridWidget
              props={{ columns: 2, gap: 'md' }}
              bind={{ value: null }}
              on={defaultOn}
              context={defaultContext}
            >
              <InputWidget
                props={{ label: 'Name' }}
                bind={{
                  value: 'Acme Corp',
                  meta: { type: 'string', label: 'Name', required: true, readOnly: false },
                }}
                on={defaultOn}
                context={defaultContext}
              />
              <InputWidget
                props={{ label: 'Code' }}
                bind={{
                  value: 'ACME',
                  meta: { type: 'string', label: 'Code', required: false, readOnly: false },
                }}
                on={defaultOn}
                context={defaultContext}
              />
            </GridWidget>
          </SectionWidget>
          <SectionWidget
            props={{ label: 'Advanced Settings', collapsible: true, defaultCollapsed: true }}
            bind={{ value: null }}
            on={defaultOn}
            context={defaultContext}
          >
            <InputWidget
              props={{ label: 'API Key' }}
              bind={{
                value: '',
                meta: { type: 'string', label: 'API Key', required: false, readOnly: false },
              }}
              on={defaultOn}
              context={defaultContext}
            />
          </SectionWidget>
        </StackWidget>
      </Card.Content>
    </Card>
  ),
};

export const DividerAndSpacer: Story = {
  name: 'Divider & Spacer',
  render: () => (
    <Card>
      <Card.Content>
        <TextWidget
          props={{ variant: 'body' }}
          bind={{ value: 'Content above divider' }}
          on={defaultOn}
          context={defaultContext}
        />
        <DividerWidget
          props={{ margin: 'md' }}
          bind={{ value: null }}
          on={defaultOn}
          context={defaultContext}
        />
        <TextWidget
          props={{ variant: 'body' }}
          bind={{ value: 'Content below divider' }}
          on={defaultOn}
          context={defaultContext}
        />
        <SpacerWidget
          props={{ size: 'xl' }}
          bind={{ value: null }}
          on={defaultOn}
          context={defaultContext}
        />
        <TextWidget
          props={{ variant: 'muted' }}
          bind={{ value: 'After a large spacer' }}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};
