import React, { Component, Suspense, useEffect, useRef, useState } from "react";
import {
  Canvas,
  useLoader,
  useFrame,
  useThree,
  extend,
} from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import HeightMap from "./images/LALT_GGT_MAP.jpg";
import {
  DoubleSide,
  Raycaster,
  RepeatWrapping,
  Vector2,
  Vector3,
  ArrowHelper,
} from "three";
import { Html } from "@react-three/drei";

// since this comes out of three.js, we "extend" it to be usable in jsx.
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
extend({ OrbitControls, ArrowHelper });

const LANDMARKS = [
  {
    name: "Mare Cognitum",
    translation: "The Known Sea",
    description: "",
    lat: -10.53,
    long: -22.31,
    coords: [-1.5269278314015393, 0.8886678868131332, -0.9346189620957661],
  },
  {
    name: "Mare Crisium",
    translation: "The Sea of Crises",
    description: "",
    lat: 16.18,
    long: 59.1,
    coords: [-1.5712205939342718, 0.12194886264150928, -1.2299282979003814],
  },
  {
    name: "Mare Insularum",
    translation: "Sea of Islands",
    description: "",
    lat: 7.79,
    long: -30.64,
    coords: [1.0124698473342153, 0.5266387877904539, -1.640726757607915],
  },
];

const CameraControls = () => {
  // Get a reference to the Three.js Camera, and the canvas html element.
  // We need these to setup the OrbitControls component.
  // https://threejs.org/docs/#examples/en/controls/OrbitControls
  const {
    camera,
    gl: { domElement },
  } = useThree();
  // Ref to the controls, so that we can update them on every frame using useFrame
  const controls = useRef();
  useFrame((state) => controls.current.update());
  return (
    <orbitControls
      rotateSpeed={0.3}
      ref={controls}
      args={[camera, domElement]}
      // autoRotate={true}
    />
  );
};

const Moon = ({ canvasRef }) => {
  const { camera } = useThree();

  const moonRef = useRef();
  const raycaster = new Raycaster();
  const arrow = useRef();
  const marker = useRef();

  const onMoonClick = (event) => {
    // the canvas takes up the whole screen, so it should map to the cursor coordinates.
    const dimensions = canvasRef.current.getBoundingClientRect();

    // Vast majority of this code from the raycasting terrain demo in the three.js examples: https://threejs.org/examples/?q=ray#webgl_geometry_terrain_raycast
    const pointer = new Vector2(0, 0);
    pointer.x = (event.clientX / dimensions.width) * 2 - 1;
    pointer.y = -(event.clientY / dimensions.height) * 2 + 1;
    // camera is the default one. we get a reference to it from the library.
    raycaster.setFromCamera(pointer, camera);

    // See if the ray from the camera into the world hits one of our meshes
    const intersects = raycaster.intersectObject(moonRef.current, true);

    // Toggle rotation bool for meshes that we clicked
    if (intersects.length > 0) {
      console.log("intersect: ", intersects[0]);
      if (intersects[0].face) {
        // const n = new Vector3();
        // n.copy(intersects[0].face.normal);
        // n.transformDirection(intersects[0].object.matrixWorld);

        // from Sean Bradley's three.js raycaster tutorial: https://sbcode.net/threejs/raycaster/
        // arrow.current.setDirection(n);
        // arrow.current.position.copy(intersects[0].point);

        // the below is, again, from the three.js terrain raycaster tutorial

        marker.current && marker.current.position.set(0, 0, 0);
        marker.current && marker.current.lookAt(intersects[0].face.normal);

        console.log("point: ", intersects[0].point);
        marker.current && marker.current.position.copy(intersects[0].point);
      }
    }
  };

  const [rotating, setRotating] = useState(false); // this was when we rotated the moon, instead of the camera.
  const displacementMap = useLoader(TextureLoader, HeightMap);
  displacementMap.wrapS = RepeatWrapping;

  displacementMap.wrapT = RepeatWrapping;
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight />
      <mesh ref={moonRef} position={[0, 0, 0]} onClick={onMoonClick}>
        <sphereGeometry args={[2, 42, 42]} />
        <meshPhongMaterial
          displacementScale={0.2}
          color="#fff5ee"
          displacementMap={displacementMap}
          aoMap={displacementMap}
          bumpMap={displacementMap}
          side={DoubleSide}
        />
        <mesh ref={marker}>
          <coneGeometry args={[0.2, 0.2, 3, 1]} />
          <meshPhongMaterial color="red" />
        </mesh>

        <Html as="div" wrapperClass="hud" position={[-3, 0]}>
         {LANDMARKS.map(({ name, lat, long, coords }) => {
            return (
              <div key={name} className="landmark">
                <p>{name}</p>
              </div>
            );
          })}
         <p className="left">Click and drag the moon to make it rotate -- click on the surface in a particular spot to set a flag. Scroll to zoom in or out.</p>
         <p className="right">We can now get the location on the surface of the globe where the user clicks -- is it possible to get the location for the various craters, and correlate that to the click? I want to have lines going from the NAMES of landmarks to a flag staked at that particular landmark. </p>
        </Html>
      </mesh>
    </>
  );
};

export const Frame = () => {
  const canvas = useRef();
  return (
    <Canvas ref={canvas}>
      <CameraControls />
      <Suspense fallback={null}>
        <Moon canvasRef={canvas} />
      </Suspense>
    </Canvas>
  );
};
