import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => { cleanup(); });
import { ToolCallBadge, getToolLabel } from "../ToolCallBadge";

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/App.tsx" })).toBe("Creating App.tsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/src/components/Button.tsx" })).toBe("Editing Button.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/index.tsx" })).toBe("Editing index.tsx");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/src/index.tsx" })).toBe("Reading index.tsx");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/src/App.tsx" })).toBe("Undoing edit on App.tsx");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/src/old.tsx", new_path: "/src/New.tsx" })).toBe("Renaming old.tsx → New.tsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/src/temp.tsx" })).toBe("Deleting temp.tsx");
});

test("getToolLabel: unknown tool falls back to capitalized name", () => {
  expect(getToolLabel("some_unknown_tool", {})).toBe("Some Unknown Tool");
});

// --- ToolCallBadge render tests ---

test("ToolCallBadge shows spinner and label when in progress", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.tsx")).toBeDefined();
  // spinner rendered via animate-spin class
  const spinner = document.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});

test("ToolCallBadge shows green dot and label when done", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/App.tsx" }}
      state="result"
      result="ok"
    />
  );
  expect(screen.getByText("Creating App.tsx")).toBeDefined();
  const dot = container.querySelector(".bg-emerald-500");
  expect(dot).not.toBeNull();
  expect(document.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge shows spinner when state is partial-call", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/src/Button.tsx" }}
      state="partial-call"
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
  expect(document.querySelector(".animate-spin")).not.toBeNull();
});

test("ToolCallBadge: file_manager rename label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/src/old.tsx", new_path: "/src/New.tsx" }}
      state="result"
      result={{ success: true }}
    />
  );
  expect(screen.getByText("Renaming old.tsx → New.tsx")).toBeDefined();
});

test("ToolCallBadge: file_manager delete label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/src/temp.tsx" }}
      state="result"
      result={{ success: true }}
    />
  );
  expect(screen.getByText("Deleting temp.tsx")).toBeDefined();
});
