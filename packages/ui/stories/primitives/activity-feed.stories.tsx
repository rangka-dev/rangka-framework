import type { Meta, StoryObj } from '@storybook/react';
import { ActivityFeed } from '../../src/primitives/activity-feed';
import { Avatar } from '../../src/primitives/avatar';
import { Icon } from '../../src/primitives/icon';
import { Plus, Archive, Send, CreditCard, FileText } from 'lucide-react';

const meta: Meta = {
  title: 'Primitives/ActivityFeed',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

export const ChangeTracking: Story = {
  name: 'Change Tracking',
  render: () => (
    <ActivityFeed showConnector>
      <ActivityFeed.Item type="change">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="2 hours ago">
            <span className="font-medium text-foreground">John Doe</span>
            <span className="text-muted-foreground">changed Status</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <ActivityFeed.Diff from="Draft" to="Confirmed" />
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="change">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>AB</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="5 hours ago">
            <span className="font-medium text-foreground">Alice Brown</span>
            <span className="text-muted-foreground">changed Priority</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <ActivityFeed.Diff from="Normal" to="High" />
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="change">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>MK</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="yesterday">
            <span className="font-medium text-foreground">Mike Kim</span>
            <span className="text-muted-foreground">changed Assignee</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <ActivityFeed.Diff from="Unassigned" to="Alice Brown" />
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>
    </ActivityFeed>
  ),
};

export const EventLog: Story = {
  name: 'Event Log',
  render: () => (
    <ActivityFeed showConnector>
      <ActivityFeed.Item type="event">
        <ActivityFeed.Avatar>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Icon icon={Send} size="sm" className="text-primary" />
          </div>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="1 hour ago">
            <span className="font-medium text-foreground">Invoice sent</span>
            <span className="text-muted-foreground">to billing@acme.com</span>
          </ActivityFeed.Header>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="event">
        <ActivityFeed.Avatar>
          <div className="flex size-8 items-center justify-center rounded-full bg-green-500/10">
            <Icon icon={CreditCard} size="sm" className="text-green-600" />
          </div>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="3 hours ago">
            <span className="font-medium text-foreground">Payment received</span>
            <span className="text-muted-foreground">$4,675.00 via bank transfer</span>
          </ActivityFeed.Header>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="event">
        <ActivityFeed.Avatar>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Icon icon={FileText} size="sm" className="text-primary" />
          </div>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="yesterday">
            <span className="font-medium text-foreground">PDF generated</span>
            <span className="text-muted-foreground">INV-2026-0142.pdf</span>
          </ActivityFeed.Header>
        </ActivityFeed.Content>
      </ActivityFeed.Item>
    </ActivityFeed>
  ),
};

export const Comments: Story = {
  name: 'Comments',
  render: () => (
    <ActivityFeed showConnector>
      <ActivityFeed.Item type="comment">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>AB</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="30 minutes ago">
            <span className="font-medium text-foreground">Alice Brown</span>
            <span className="text-muted-foreground">commented</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <p className="text-2xs text-foreground/80">
              Please review the line items before confirming. The quantities on rows 3-5 look off
              compared to the original PO.
            </p>
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="comment">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="2 hours ago">
            <span className="font-medium text-foreground">John Doe</span>
            <span className="text-muted-foreground">commented</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <p className="text-2xs text-foreground/80">
              <span className="font-medium text-primary">@Alice Brown</span> Fixed, the quantities
              now match PO-2026-089. Ready for your review.
            </p>
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>
    </ActivityFeed>
  ),
};

export const SystemEvents: Story = {
  name: 'System Events',
  render: () => (
    <ActivityFeed showConnector>
      <ActivityFeed.Item type="system">
        <ActivityFeed.Avatar>
          <div className="flex size-8 items-center justify-center rounded-full bg-foreground/6">
            <Icon icon={Plus} size="sm" className="text-muted-foreground" />
          </div>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="Jun 20, 2026">
            <span className="text-muted-foreground">Record created by</span>
            <span className="font-medium text-foreground">John Doe</span>
          </ActivityFeed.Header>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="system">
        <ActivityFeed.Avatar>
          <div className="flex size-8 items-center justify-center rounded-full bg-foreground/6">
            <Icon icon={Archive} size="sm" className="text-muted-foreground" />
          </div>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="Jun 28, 2026">
            <span className="text-muted-foreground">Record archived by</span>
            <span className="font-medium text-foreground">Alice Brown</span>
          </ActivityFeed.Header>
        </ActivityFeed.Content>
      </ActivityFeed.Item>
    </ActivityFeed>
  ),
};

export const MixedFeed: Story = {
  name: 'Mixed Feed',
  render: () => (
    <ActivityFeed showConnector>
      <ActivityFeed.Item type="comment">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="10 minutes ago">
            <span className="font-medium text-foreground">John Doe</span>
            <span className="text-muted-foreground">commented</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <p className="text-2xs text-foreground/80">
              Shipping confirmed with the warehouse. Expected delivery on Friday.
            </p>
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="change">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="15 minutes ago">
            <span className="font-medium text-foreground">John Doe</span>
            <span className="text-muted-foreground">changed Status</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <ActivityFeed.Diff from="Confirmed" to="Shipped" />
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="event">
        <ActivityFeed.Avatar>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Icon icon={Send} size="sm" className="text-primary" />
          </div>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="1 hour ago">
            <span className="font-medium text-foreground">Invoice sent</span>
            <span className="text-muted-foreground">to billing@acme.com</span>
          </ActivityFeed.Header>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="change">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>AB</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="3 hours ago">
            <span className="font-medium text-foreground">Alice Brown</span>
            <span className="text-muted-foreground">changed Priority</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <ActivityFeed.Diff from="Normal" to="High" />
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="system">
        <ActivityFeed.Avatar>
          <div className="flex size-8 items-center justify-center rounded-full bg-foreground/6">
            <Icon icon={Plus} size="sm" className="text-muted-foreground" />
          </div>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="Jun 20, 2026">
            <span className="text-muted-foreground">Record created by</span>
            <span className="font-medium text-foreground">John Doe</span>
          </ActivityFeed.Header>
        </ActivityFeed.Content>
      </ActivityFeed.Item>
    </ActivityFeed>
  ),
};

export const EmptyState: Story = {
  name: 'Empty State',
  render: () => (
    <ActivityFeed>
      <ActivityFeed.Empty />
    </ActivityFeed>
  ),
};

export const WithoutConnector: Story = {
  name: 'Without Connector',
  render: () => (
    <ActivityFeed>
      <ActivityFeed.Item type="change">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="2 hours ago">
            <span className="font-medium text-foreground">John Doe</span>
            <span className="text-muted-foreground">changed Status</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <ActivityFeed.Diff from="Draft" to="Confirmed" />
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>

      <ActivityFeed.Item type="comment">
        <ActivityFeed.Avatar>
          <Avatar size="sm">
            <Avatar.Fallback>AB</Avatar.Fallback>
          </Avatar>
        </ActivityFeed.Avatar>
        <ActivityFeed.Content>
          <ActivityFeed.Header timestamp="5 hours ago">
            <span className="font-medium text-foreground">Alice Brown</span>
            <span className="text-muted-foreground">commented</span>
          </ActivityFeed.Header>
          <ActivityFeed.Body>
            <p className="text-2xs text-foreground/80">Looks good, approved.</p>
          </ActivityFeed.Body>
        </ActivityFeed.Content>
      </ActivityFeed.Item>
    </ActivityFeed>
  ),
};
