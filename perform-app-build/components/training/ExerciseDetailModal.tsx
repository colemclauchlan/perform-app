"use client";

import { Modal } from "@/components/ui/Modal";
import { ExerciseCatalogItem } from "@/types/database";
import { LiftProgression } from "@/hooks/useTraining";
import { muscleColor } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Dumbbell, Target, Activity, Trophy, Lightbulb, AlertTriangle, ListChecks } from "lucide-react";

function MuscleDot({ muscle }: { muscle: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: muscleColor(muscle) }} />
      {muscle}
    </span>
  );
}

export function ExerciseDetailModal({
  exercise,
  progression,
  open,
  onClose,
}: {
  exercise: ExerciseCatalogItem | null;
  progression?: LiftProgression;
  open: boolean;
  onClose: () => void;
}) {
  if (!exercise) return null;
  const secondary = (exercise.secondary_muscles || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Modal open={open} onClose={onClose} title={exercise.name} wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="teal" style={{ background: `${muscleColor(exercise.muscle_group)}22`, color: muscleColor(exercise.muscle_group) }}>
            <MuscleDot muscle={exercise.muscle_group} />
          </Badge>
          <Badge variant="default">{exercise.equipment}</Badge>
          {exercise.category && <Badge variant="default">{exercise.category}</Badge>}
          {exercise.is_compound && <Badge variant="amber">Compound</Badge>}
          {exercise.difficulty && <Badge variant="default">{exercise.difficulty}</Badge>}
          {exercise.movement_pattern && <Badge variant="default">{exercise.movement_pattern}</Badge>}
        </div>

        {progression && progression.sessions > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="card-sm text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-text-3 uppercase tracking-wide">
                <Trophy size={11} className="text-status-amber" /> Heaviest
              </div>
              <div className="text-lg font-bold mt-0.5">{progression.pr} {progression.unit}</div>
            </div>
            <div className="card-sm text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-text-3 uppercase tracking-wide">
                <Activity size={11} className="text-accent" /> Best e1RM
              </div>
              <div className="text-lg font-bold mt-0.5">{progression.e1rmPR} {progression.unit}</div>
            </div>
            <div className="card-sm text-center">
              <div className="text-[10px] text-text-3 uppercase tracking-wide">Sets logged</div>
              <div className="text-lg font-bold mt-0.5">{progression.sessions}</div>
            </div>
          </div>
        )}

        {(secondary.length > 0 || exercise.equipment_detail) && (
          <div className="grid grid-cols-2 gap-3">
            {secondary.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-2 mb-1.5">
                  <Target size={12} /> Secondary muscles
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-text-2">
                  {secondary.map((m) => (
                    <MuscleDot key={m} muscle={m} />
                  ))}
                </div>
              </div>
            )}
            {exercise.equipment_detail && (
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-2 mb-1.5">
                  <Dumbbell size={12} /> Setup
                </div>
                <div className="text-xs text-text-2">{exercise.equipment_detail}</div>
              </div>
            )}
          </div>
        )}

        {exercise.instructions && (
          <Section icon={ListChecks} title="How to perform" color="text-accent">
            {exercise.instructions}
          </Section>
        )}
        {exercise.tips && (
          <Section icon={Lightbulb} title="Tips" color="text-status-green">
            {exercise.tips}
          </Section>
        )}
        {exercise.common_mistakes && (
          <Section icon={AlertTriangle} title="Common mistakes" color="text-status-amber">
            {exercise.common_mistakes}
          </Section>
        )}

        <div className="flex justify-end pt-1">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

function Section({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-sm">
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold mb-1.5 ${color}`}>
        <Icon size={13} /> {title}
      </div>
      <div className="text-[13px] text-text-2 leading-relaxed whitespace-pre-line">{children}</div>
    </div>
  );
}
