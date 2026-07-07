import ErrorBoundary from "./ErrorBoundary";

function Bomb() {
  throw new Error("Something broke!");
}

function SafeChild() {
  return <div style={{ padding: 24, fontSize: 16 }}>Everything is working fine.</div>;
}

export default {
  title: "Components/ErrorBoundary",
  component: ErrorBoundary,
  tags: ["autodocs"],
};

export const Normal = {
  render: () => (
    <ErrorBoundary>
      <SafeChild />
    </ErrorBoundary>
  ),
};

export const WithError = {
  render: () => (
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>
  ),
};
