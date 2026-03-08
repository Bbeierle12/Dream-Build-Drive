"use client"

import { useState, useRef } from "react"
import type { TaskWithDependencies } from "@/lib/types"
import type { BarPosition } from "@/lib/gantt-utils"
import { formatDateShort } from "@/lib/gantt-utils"
import { GANTT_CONFIG } from "@/lib/constants"
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants"
import { pixelOffsetToDays } from "@/lib/gantt-drag-utils"

type GanttBarProps = {
  task: TaskWithDependencies
  position: BarPosition
  isCritical?: boolean
  onDragReschedule?: (taskId: string, daysDelta: number) => void
}

const STATUS_BAR_COLORS: Record<string, string> = {
  backlog: "bg-zinc-600",
  todo: "bg-blue-600",
  in_progress: "bg-yellow-600",
  in_review: "bg-purple-600",
  done: "bg-green-600",
}

const PRIORITY_BORDER_COLORS: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-blue-500",
  low: "border-l-zinc-500",
}

export function GanttBar({ task, position, isCritical, onDragReschedule }: GanttBarProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartRef = useRef<number>(0)

  const barColor = STATUS_BAR_COLORS[task.status] ?? "bg-zinc-600"
  const borderColor = PRIORITY_BORDER_COLORS[task.priority] ?? ""
  const barHeight = GANTT_CONFIG.ROW_HEIGHT - 12
  const topOffset = 6
  const criticalClass = isCritical ? "ring-1 ring-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : ""

  function handleMouseDown(e: React.MouseEvent) {
    if (!onDragReschedule) return
    e.preventDefault()
    dragStartRef.current = e.clientX
    setIsDragging(true)

    function handleMouseMove(moveEvent: MouseEvent) {
      const dx = moveEvent.clientX - dragStartRef.current
      setDragOffset(dx)
    }

    function handleMouseUp(upEvent: MouseEvent) {
      const dx = upEvent.clientX - dragStartRef.current
      const daysDelta = pixelOffsetToDays(dx)
      if (daysDelta !== 0) {
        onDragReschedule!(task.id, daysDelta)
      }
      setDragOffset(0)
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  if (task.is_milestone) {
    const size = 16
    const centerX = position.left + position.width / 2 - size / 2
    return (
      <div
        className="absolute"
        style={{ left: centerX, top: topOffset + (barHeight - size) / 2 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={`${barColor} rotate-45`}
          style={{ width: size, height: size }}
        />
        {showTooltip && <Tooltip task={task} />}
      </div>
    )
  }

  return (
    <div
      className={`absolute rounded-sm ${barColor} ${borderColor} ${criticalClass} border-l-2 flex items-center overflow-hidden select-none`}
      style={{
        left: position.left + dragOffset,
        top: topOffset,
        width: position.width,
        height: barHeight,
        cursor: onDragReschedule ? (isDragging ? "grabbing" : "grab") : "default",
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        setShowTooltip(false)
      }}
    >
      {position.width > 40 && (
        <span className="text-[11px] text-white px-2 truncate">
          {task.title}
        </span>
      )}
      {showTooltip && !isDragging && <Tooltip task={task} />}
    </div>
  )
}

function Tooltip({ task }: { task: TaskWithDependencies }) {
  return (
    <div className="absolute z-50 left-0 top-full mt-1 w-56 rounded-md border border-zinc-700 bg-zinc-900 p-3 shadow-lg pointer-events-none">
      <p className="text-sm font-semibold text-zinc-100 truncate">
        {task.title}
      </p>
      <div className="mt-1 space-y-0.5 text-xs text-zinc-400">
        <p>Status: {TASK_STATUS_LABELS[task.status] ?? task.status}</p>
        <p>Priority: {PRIORITY_LABELS[task.priority] ?? task.priority}</p>
        {task.start_date && (
          <p>Start: {formatDateShort(new Date(task.start_date))}</p>
        )}
        {task.due_date && (
          <p>Due: {formatDateShort(new Date(task.due_date))}</p>
        )}
      </div>
    </div>
  )
}
