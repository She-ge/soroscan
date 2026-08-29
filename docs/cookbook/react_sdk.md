# Integrating the SoroScan TypeScript SDK in React

This guide walks through integrating the `@soroscan/sdk` into a React application (Next.js or Vite). We will build a reusable hook to fetch contract events, handle loading/error states, and manage pagination using the SDK's built-in `Paginator`.

## Prerequisites
Ensure the SDK is installed in your frontend project:
```bash
npm install @soroscan/sdk