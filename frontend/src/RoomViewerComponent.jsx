import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Size [width, depth, height] in meters for furniture we add
const SIZES = {
  bed: [1.6, 2, 0.5], sofa: [2, 0.9, 0.8], chair: [0.5, 0.5, 0.9], table: [1.2, 0.8, 0.75],
  desk: [1.2, 0.6, 0.75], wardrobe: [1.2, 0.6, 2], shelf: [0.8, 0.3, 1.8], tv: [1, 0.1, 0.6],
  lamp: [0.3, 0.3, 1.5], plant: [0.5, 0.5, 1], rug: [2, 1.4, 0.02], curtain: [1.2, 0.1, 2],
  other: [0.5, 0.5, 0.5],
};
const COLORS = { plant: '#3f8f4f', rug: '#c9a66b', lamp: '#f5d76e' };
const LIGHT_COLORS = { warm: '#ffd9a0', neutral: '#ffffff', cool: '#cfe3ff' };
const CORNERS = [[0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]];
const NEAR_WALL = { north: [0.5, 0.1], south: [0.5, 0.9], east: [0.9, 0.5], west: [0.1, 0.5] };

// Where does new furniture go? Returns [x, z] as fractions from 0 to 1
function place(placement, n, windows) {
  if (placement === 'corners') return CORNERS[n % 4];
  if (placement === 'center') return [0.5, 0.5];
  if (placement === 'near_window') return NEAR_WALL[windows?.[0]?.wall] ?? [0.5, 0.5];
  return [((n % 5) + 1) / 6, 0.08]; // along_wall: spread along the north wall
}

// Applies the AI's "modifications" to the room data (colors, new and removed furniture, light)
function applyModifications(room, mods) {
  const next = {
    ...room,
    walls: mods.walls ? { ...room.walls, ...mods.walls } : room.walls,
    floor: mods.floor ? { ...room.floor, ...mods.floor } : room.floor,
    furniture: room.furniture.filter((item) => !(mods.removeFurniture ?? []).includes(item.id)),
    lightTone: mods.lighting?.tone ?? 'neutral',
  };

  let n = 0;
  for (const add of mods.addFurniture ?? []) {
    for (let i = 0; i < add.quantity; i++) {
      const [w, d, h] = SIZES[add.type] ?? SIZES.other;
      const [x, z] = place(add.placement, n, room.windows);
      next.furniture.push({
        id: `new-${n}`,
        type: add.type,
        color: COLORS[add.type] ?? '#a3a3a3',
        position: { x, z },
        sizeM: { w, d, h },
      });
      n += 1;
    }
  }
  return next;
}

function Furniture({ item, W, L }) {
  const { w, d, h } = item.sizeM;
  const x = (clamp(item.position.x, 0, 1) - 0.5) * W;
  const z = (clamp(item.position.z, 0, 1) - 0.5) * L;

  if (item.type === 'plant') {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.15, 0.12, 0.3, 16]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={item.color} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={[x, clamp(h, 0.02, 3) / 2, z]}>
      <boxGeometry args={[clamp(w, 0.05, 4), clamp(h, 0.02, 3), clamp(d, 0.05, 4)]} />
      <meshStandardMaterial color={item.color} />
    </mesh>
  );
}

function Room({ room }) {
  const W = clamp(room.dimensions.widthM, 2, 12);
  const L = clamp(room.dimensions.lengthM, 2, 12);
  const H = clamp(room.dimensions.heightM, 2, 4);

  // The south wall is left out, so we can look into the room
  const walls = [
    { name: 'north', pos: [0, H / 2, -L / 2], rotY: 0, len: W },
    { name: 'west', pos: [-W / 2, H / 2, 0], rotY: Math.PI / 2, len: L },
    { name: 'east', pos: [W / 2, H / 2, 0], rotY: -Math.PI / 2, len: L },
  ];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color={room.floor.color} />
      </mesh>

      {walls.map((wall) => (
        <group key={wall.name} position={wall.pos} rotation={[0, wall.rotY, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[wall.len + 0.2, H, 0.1]} />
            <meshStandardMaterial color={room.walls.color} />
          </mesh>
          {(room.windows ?? []).filter((win) => win.wall === wall.name).map((win, i) => (
            <mesh key={`window-${i}`} position={[0, 1.5 - H / 2, 0.01]}>
              <boxGeometry args={[clamp(win.widthM, 0.4, wall.len * 0.8), clamp(win.heightM, 0.4, H * 0.8), 0.02]} />
              <meshStandardMaterial color="#9ec9ff" />
            </mesh>
          ))}
          {(room.doors ?? []).filter((door) => door.wall === wall.name).map((door, i) => (
            <mesh key={`door-${i}`} position={[0, clamp(door.heightM, 1.5, 2.5) / 2 - H / 2, 0.01]}>
              <boxGeometry args={[clamp(door.widthM, 0.6, 1.5), clamp(door.heightM, 1.5, 2.5), 0.02]} />
              <meshStandardMaterial color="#7a5230" />
            </mesh>
          ))}
        </group>
      ))}

      {room.furniture.map((item) => (
        <Furniture key={item.id} item={item} W={W} L={L} />
      ))}
    </group>
  );
}

export default function RoomViewer({ room, modifications }) {
  const [view, setView] = useState('after');

  const shown = useMemo(
    () => (view === 'after' ? applyModifications(room, modifications) : { ...room, lightTone: 'neutral' }),
    [view, room, modifications]
  );

  const H = clamp(room.dimensions.heightM, 2, 4);
  const size = Math.max(clamp(room.dimensions.widthM, 2, 12), clamp(room.dimensions.lengthM, 2, 12));
  const lightColor = LIGHT_COLORS[shown.lightTone] ?? '#ffffff';

  return (
    <div>
      <div className="buttons">
        <button className={view === 'before' ? 'button' : 'button secondary'} onClick={() => setView('before')}>
          Before
        </button>
        <button className={view === 'after' ? 'button' : 'button secondary'} onClick={() => setView('after')}>
          After
        </button>
      </div>
      <div className="viewer">
        <Canvas camera={{ position: [0, H * 1.3, size * 1.1], fov: 50 }}>
          <ambientLight color={lightColor} intensity={1.2} />
          <directionalLight color={lightColor} position={[3, 6, 4]} intensity={1.5} />
          <Room room={shown} />
          <OrbitControls target={[0, H / 3, 0]} />
        </Canvas>
      </div>
      <p className="hint">Drag to rotate, scroll or pinch to zoom. The 3D room is built from the AI's estimates, so it is an approximation.</p>
    </div>
  );
}