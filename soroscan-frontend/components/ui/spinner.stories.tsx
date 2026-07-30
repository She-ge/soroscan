import type { Meta, StoryObj } from "@storybook/react"
import { Spinner } from "@/components/ui/spinner"

const meta: Meta<typeof Spinner> = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["mini", "default", "large"],
      description: "Size of the spinner",
    },
    color: {
      control: "select",
      options: ["default", "success", "warning", "error"],
      description: "Color variant of the spinner",
    },
    label: {
      control: "text",
      description: "Accessible label for screen readers",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
}

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  args: {},
}

export const Mini: Story = {
  args: {
    size: "mini",
  },
}

export const Large: Story = {
  args: {
    size: "large",
  },
}

export const Success: Story = {
  args: {
    color: "success",
  },
}

export const Warning: Story = {
  args: {
    color: "warning",
  },
}

export const Error: Story = {
  args: {
    color: "error",
  },
}

export const CustomLabel: Story = {
  args: {
    label: "Fetching data...",
  },
}

export const CustomClassName: Story = {
  args: {
    className: "border-4",
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Spinner size="mini" />
      <Spinner />
      <Spinner size="large" />
      <Spinner color="success" />
      <Spinner color="warning" />
      <Spinner color="error" />
    </div>
  ),
}