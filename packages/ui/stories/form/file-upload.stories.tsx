import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FileUpload } from '../../src/form/file-upload';

const meta: Meta = {
  title: 'Form/FileUpload',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

export const Dropzone: Story = {
  name: 'Dropzone',
  render: () => (
    <div className="w-80">
      <FileUpload>
        <FileUpload.Dropzone onChange={() => {}} />
      </FileUpload>
    </div>
  ),
};

export const WithFile: Story = {
  name: 'With File',
  render: () => (
    <div className="w-80">
      <FileUpload>
        <FileUpload.Item name="product-image.png" size="2.4 MB" onRemove={() => {}} />
      </FileUpload>
    </div>
  ),
};

export const MultipleFiles: Story = {
  name: 'Multiple Files',
  render: () => (
    <div className="w-80">
      <FileUpload>
        <FileUpload.Dropzone onChange={() => {}} className="h-16" />
        <FileUpload.Item name="invoice-001.pdf" size="156 KB" onRemove={() => {}} />
        <FileUpload.Item name="receipt.png" size="1.2 MB" onRemove={() => {}} />
        <FileUpload.Item name="contract-v2.docx" size="89 KB" onRemove={() => {}} />
      </FileUpload>
    </div>
  ),
};

export const Interactive: Story = {
  name: 'Interactive',
  render: function Demo() {
    const [files, setFiles] = useState<{ name: string; size: string }[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files ?? []).map((f) => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    };

    const handleRemove = (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
      <div className="w-80">
        <FileUpload>
          <FileUpload.Dropzone onChange={handleChange} accept="image/*" />
          {files.map((file, i) => (
            <FileUpload.Item
              key={i}
              name={file.name}
              size={file.size}
              onRemove={() => handleRemove(i)}
            />
          ))}
        </FileUpload>
      </div>
    );
  },
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div className="w-80">
      <FileUpload>
        <FileUpload.Dropzone disabled onChange={() => {}} />
        <FileUpload.Item name="locked-file.pdf" size="500 KB" disabled />
      </FileUpload>
    </div>
  ),
};
