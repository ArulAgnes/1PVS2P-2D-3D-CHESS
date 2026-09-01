"use client";

/**
 * GameBoard3D — the authoritative engine state rendered as a playable 3D board.
 *
 * Responsibilities:
 *  - render the stone board + all live pieces from the engine state
 *  - clickable squares (selection / move input)
 *  - legal-move + capture highlights, last-move highlights
 *  - capture presentation (fragments + shrinking ghost)
 *
 * This layer never mutates chess state; it calls store actions which invoke the engine.
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { Board } from "../board/Board";
import { ChessPiece } from "../pieces/ChessPiece";
import { useGame } from "@/stores/useGame";
import { movesFor } from "@/features/chess/engine";
import type { PieceType } from "@/features/chess/types";
import {
  squareToWorld,
  indexToSquare,
  SQUARE_SIZE,
  PIECE_BASE_Y,
  type BoardOrientation,
} from "@/features/chess/board";

export function GameBoard3D({ orientation }: { orientation: BoardOrientation }) {
  const state = useGame((s) => s.state);
  const pieceIds = useGame((s) => s.pieceIds);
  const selected = useGame((s) => s.selected);
  const lastMove = useGame((s) => s.lastMove);
  const capture = useGame((s) => s.capture);
  const selectSquare = useGame((s) => s.selectSquare);

  const legalTargets = useMemo(() => {
    if (selected == null) return { moves: [], captureSquares: new Set<number>() };
    const moves = movesFor(state, selected);
    const captureSquares = new Set<number>();
    for (const m of moves) if (m.captured) captureSquares.add(m.to);
    return { moves, captureSquares };
  }, [state, selected]);

  return (
    <group>
      <Board />

      {/* Last move highlights */}
      {lastMove && (
        <>
          <SquareMarker square={lastMove.from} orientation={orientation} kind="last" />
          <SquareMarker square={lastMove.to} orientation={orientation} kind="last" />
        </>
      )}

      {/* Selection highlight */}
      {selected != null && (
        <SquareMarker square={selected} orientation={orientation} kind="selected" />
      )}

      {/* Legal move highlights */}
      {legalTargets.moves.map((m) => (
        <SquareMarker
          key={m.to}
          square={m.to}
          orientation={orientation}
          kind={legalTargets.captureSquares.has(m.to) ? "capture" : "move"}
        />
      ))}

      {/* Clickable squares */}
      {Array.from({ length: 64 }, (_, i) => (
        <ClickableSquare
          key={`sq-${i}`}
          index={i}
          orientation={orientation}
          onSelect={selectSquare}
        />
      ))}

      {/* Live pieces */}
      {state.board.map((p, i) => {
        if (!p) return null;
        const w = squareToWorld(indexToSquare(i), orientation);
        return (
          <ChessPiece
            key={pieceIds[i] ?? `p-${i}`}
            type={p.type}
            color={p.color}
            position={[w.x, PIECE_BASE_Y, w.z]}
            rotationY={p.color === "white" ? 0 : Math.PI}
            selected={selected === i}
            arcHeight={p.type === "knight" ? 0.8 : 0.5}
          />
        );
      })}

      {/* Capture presentation */}
      {capture && (
        <CaptureFx
          key={capture.id}
          square={capture.square}
          type={capture.type}
          color={capture.color}
          orientation={orientation}
        />
      )}
    </group>
  );
}

function SquareMarker({
  square,
  orientation,
  kind,
}: {
  square: number;
  orientation: BoardOrientation;
  kind: "move" | "capture" | "last" | "selected";
}) {
  const w = squareToWorld(indexToSquare(square), orientation);
  if (kind === "move") {
    return (
      <mesh position={[w.x, PIECE_BASE_Y + 0.015, w.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.13, 0.2, 32]} />
        <meshBasicMaterial color="#c9f2c9" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    );
  }
  if (kind === "capture") {
    return (
      <mesh position={[w.x, PIECE_BASE_Y + 0.015, w.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.34, 32]} />
        <meshBasicMaterial color="#ff8a7a" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    );
  }
  if (kind === "selected") {
    return (
      <mesh position={[w.x, PIECE_BASE_Y + 0.012, w.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SQUARE_SIZE * 0.96, SQUARE_SIZE * 0.96]} />
        <meshBasicMaterial color="#d8b45c" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    );
  }
  return (
    <mesh position={[w.x, PIECE_BASE_Y + 0.012, w.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[SQUARE_SIZE * 0.96, SQUARE_SIZE * 0.96]} />
      <meshBasicMaterial color="#f4d58d" transparent opacity={0.16} depthWrite={false} />
    </mesh>
  );
}

function ClickableSquare({
  index,
  orientation,
  onSelect,
}: {
  index: number;
  orientation: BoardOrientation;
  onSelect: (i: number) => void;
}) {
  const w = squareToWorld(indexToSquare(index), orientation);
  return (
    <mesh
      position={[w.x, PIECE_BASE_Y + 0.02, w.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(index);
      }}
    >
      <planeGeometry args={[SQUARE_SIZE, SQUARE_SIZE]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** Stone-fragment burst + shrinking ghost of the captured piece. */
function CaptureFx({
  square,
  type,
  color,
  orientation,
}: {
  square: number;
  type: PieceType;
  color: "white" | "black";
  orientation: BoardOrientation;
}) {
  const w = squareToWorld(indexToSquare(square), orientation);
  const fragments = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        dir: new THREE.Vector3(Math.sin(i * 2.4), Math.random() * 0.6 + 0.3, Math.cos(i * 2.4)).normalize(),
        scale: 0.03 + Math.random() * 0.04,
      })),
    [],
  );
  const refs = useRefGroup(fragments.length);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((r, i) => {
      if (!r) return;
      const f = fragments[i];
      r.position.set(
        w.x + f.dir.x * t * 1.6,
        Math.max(PIECE_BASE_Y + 0.05, PIECE_BASE_Y + 0.3 + f.dir.y * t * 2 - 4.9 * t * t),
        w.z + f.dir.z * t * 1.6,
      );
      r.rotation.x += delta * 3;
      r.rotation.y += delta * 2;
      const scl = Math.max(0, f.scale * (1 - t * 0.9));
      r.scale.setScalar(scl);
    });
  });

  return (
    <group>
      {/* Shrinking ghost of the captured piece */}
      <CaptureGhost square={square} type={type} color={color} orientation={orientation} />
      {fragments.map((f) => (
        <mesh key={f.id} ref={(el) => { refs.current[f.id] = el; }}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={color === "white" ? "#cfc9bd" : "#2a2522"}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function CaptureGhost({
  square,
  type,
  color,
  orientation,
}: {
  square: number;
  type: PieceType;
  color: "white" | "black";
  orientation: BoardOrientation;
}) {
  const w = squareToWorld(indexToSquare(square), orientation);
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const s = ref.current.scale.x - delta * 1.8;
    ref.current.scale.setScalar(Math.max(0.001, s));
    ref.current.position.y -= delta * 0.3;
  });

  return (
    <group ref={ref} position={[w.x, PIECE_BASE_Y, w.z]}>
      <ChessPiece type={type} color={color} position={[0, 0, 0]} arcHeight={0} />
    </group>
  );
}

/** Tiny hook to hold an array of mesh refs without per-frame React state. */
function useRefGroup(count: number) {
  const refs = useMemo(
    () => ({ current: Array.from({ length: count }, () => null as THREE.Mesh | null) }),
    [count],
  );
  return refs;
}
