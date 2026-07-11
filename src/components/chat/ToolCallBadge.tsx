import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "partial-call" | "result";
  result?: unknown;
}

function basename(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? path;
}

export function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  const command = args.command as string | undefined;
  const path = typeof args.path === "string" ? basename(args.path) : "";

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
      case "insert":
        return `Editing ${path}`;
      case "view":
        return `Reading ${path}`;
      case "undo_edit":
        return `Undoing edit on ${path}`;
    }
  }

  if (toolName === "file_manager") {
    if (command === "rename") {
      const newPath = typeof args.new_path === "string" ? basename(args.new_path) : "";
      return `Renaming ${path} → ${newPath}`;
    }
    if (command === "delete") {
      return `Deleting ${path}`;
    }
  }

  return toolName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const label = getToolLabel(toolName, args);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
