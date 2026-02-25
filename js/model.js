/* ===== 3D MODEL LOADER (Three.js) ===== */

let teethScene, teethCamera, teethRenderer, teethControls, teethModel;
let modelLoaded = false;
let highlightRing, highlightGlow;

// Approximate position of tooth #36 (left mandibular 1st molar)
// Derived from vertex analysis: lower jaw occlusal surface
const TOOTH_36_POS = new THREE.Vector3(-0.17, 4.813, 0.10);
const TOOTH_36_RADIUS = 0.035;

function initTeethModel() {
    if (modelLoaded) return;

    const container = document.getElementById('modelContainer');
    const canvas = document.getElementById('teethCanvas');
    const loadingEl = document.getElementById('modelLoading');

    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    teethScene = new THREE.Scene();
    teethScene.background = new THREE.Color(0x111827);

    // Camera
    teethCamera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);
    teethCamera.position.set(0, 5, 0.8);
    teethCamera.lookAt(0, 5, 0);

    // Renderer
    teethRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    teethRenderer.setSize(width, height);
    teethRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    teethRenderer.outputEncoding = THREE.sRGBEncoding;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    teethScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 8, 3);
    teethScene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x6c8cff, 0.3);
    dirLight2.position.set(-2, 4, -2);
    teethScene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x00d4aa, 0.4, 10);
    pointLight.position.set(0, 6, 1);
    teethScene.add(pointLight);

    // Red highlight light on tooth 36
    highlightGlow = new THREE.PointLight(0xff3333, 0.8, 0.3);
    highlightGlow.position.copy(TOOTH_36_POS).add(new THREE.Vector3(0, 0, 0.05));
    teethScene.add(highlightGlow);

    // Controls
    teethControls = new THREE.OrbitControls(teethCamera, teethRenderer.domElement);
    teethControls.enableDamping = true;
    teethControls.dampingFactor = 0.08;
    teethControls.enablePan = true;
    teethControls.minDistance = 0.2;
    teethControls.maxDistance = 3;
    teethControls.target.set(0, 5, 0);

    // Load using MTLLoader + OBJLoader
    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('source/Teeth/');

    mtlLoader.load('Teeth.mtl', function (materials) {
        materials.preload();

        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('source/Teeth/');

        objLoader.load(
            'Teeth.obj',
            function (object) {
                teethModel = object;

                // Enhance materials
                object.traverse(function (child) {
                    if (child.isMesh) {
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => enhanceMaterial(mat));
                            } else {
                                enhanceMaterial(child.material);
                            }
                        }
                    }
                });

                // Center model and position camera
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                teethCamera.position.set(center.x, center.y, center.z + maxDim * 1.2);
                teethControls.target.copy(center);
                teethControls.update();

                teethScene.add(object);

                // Add tooth 36 highlight markers
                addToothHighlight();

                modelLoaded = true;

                if (loadingEl) {
                    loadingEl.style.opacity = '0';
                    setTimeout(() => { loadingEl.style.display = 'none'; }, 300);
                }
            },
            function (xhr) {
                if (xhr.lengthComputable) {
                    const percent = Math.round((xhr.loaded / xhr.total) * 100);
                    const pEl = loadingEl?.querySelector('p');
                    if (pEl) pEl.textContent = `Loading 3D Model... ${percent}%`;
                }
            },
            function (error) {
                console.error('Error loading OBJ:', error);
                loadWithoutMTL(loadingEl);
            }
        );
    }, undefined, function (error) {
        console.warn('MTL load failed, loading OBJ directly:', error);
        loadWithoutMTL(loadingEl);
    });

    // Animation loop with highlight pulse
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;

        if (teethControls) teethControls.update();

        // Pulse the highlight ring
        if (highlightRing) {
            const scale = 1 + 0.15 * Math.sin(time * 3);
            highlightRing.scale.set(scale, scale, scale);
            highlightRing.material.opacity = 0.4 + 0.3 * Math.sin(time * 3);
        }

        // Pulse the highlight glow
        if (highlightGlow) {
            highlightGlow.intensity = 0.5 + 0.4 * Math.sin(time * 2.5);
        }

        if (teethRenderer && teethScene && teethCamera) {
            teethRenderer.render(teethScene, teethCamera);
        }
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        if (!container || !teethCamera || !teethRenderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        teethCamera.aspect = w / h;
        teethCamera.updateProjectionMatrix();
        teethRenderer.setSize(w, h);
    });
}

function addToothHighlight() {
    // === REALISTIC CAVITY ON TOOTH #36 ===
    // Y is vertical in this model. The occlusal surface faces UP (+Y).
    // The cavity sits ON the top surface and extends DOWN into the tooth.

    const cavityGroup = new THREE.Group();

    // --- Outer stain ring (demineralized enamel - brown discoloration) ---
    // Flat disc on the XZ plane sitting on the tooth surface
    const stainGeo = new THREE.CylinderGeometry(0.02, 0.022, 0.002, 24);
    const stainMat = new THREE.MeshStandardMaterial({
        color: 0x5a3d2b,
        roughness: 0.95,
        metalness: 0.0,
        transparent: true,
        opacity: 0.85
    });
    const stain = new THREE.Mesh(stainGeo, stainMat);
    stain.position.set(0, 0.001, 0);
    cavityGroup.add(stain);

    // --- Main cavity opening (dark brown crater - carious dentin) ---
    // A cylinder going DOWN into the tooth
    const cavityOpenGeo = new THREE.CylinderGeometry(0.014, 0.012, 0.008, 20);
    const cavityOpenMat = new THREE.MeshStandardMaterial({
        color: 0x2d1a0e,
        roughness: 1.0,
        metalness: 0.0
    });
    const cavityOpen = new THREE.Mesh(cavityOpenGeo, cavityOpenMat);
    cavityOpen.position.set(0, -0.002, 0);
    cavityGroup.add(cavityOpen);

    // --- Deep cavity hole (almost black - deep infected dentin) ---
    const deepHoleGeo = new THREE.CylinderGeometry(0.009, 0.006, 0.01, 16);
    const deepHoleMat = new THREE.MeshStandardMaterial({
        color: 0x0a0604,
        roughness: 1.0,
        metalness: 0.0
    });
    const deepHole = new THREE.Mesh(deepHoleGeo, deepHoleMat);
    deepHole.position.set(0, -0.005, 0);
    cavityGroup.add(deepHole);

    // --- Irregular edges of the cavity (chipped enamel) ---
    const edgeData = [
        { x: 0.013, z: 0.005, s: 0.005 },
        { x: -0.011, z: 0.008, s: 0.004 },
        { x: 0.007, z: -0.010, s: 0.005 },
        { x: -0.008, z: -0.007, s: 0.004 },
        { x: 0.015, z: -0.002, s: 0.004 },
        { x: -0.014, z: 0.001, s: 0.005 },
    ];
    const edgeMat = new THREE.MeshStandardMaterial({
        color: 0x4a3018,
        roughness: 0.9,
        metalness: 0.0,
        transparent: true,
        opacity: 0.8
    });
    edgeData.forEach(e => {
        const eg = new THREE.CylinderGeometry(e.s, e.s * 0.8, 0.003, 8);
        const em = new THREE.Mesh(eg, edgeMat);
        em.position.set(e.x, 0, e.z);
        cavityGroup.add(em);
    });

    // Position the cavity group ON TOP of tooth #36
    cavityGroup.position.copy(TOOTH_36_POS);
    teethScene.add(cavityGroup);

    // === HIGHLIGHT INDICATORS ===

    // Horizontal pulsing ring hovering just above the tooth
    const ringGeo = new THREE.RingGeometry(0.028, 0.033, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff3333,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        depthTest: false
    });
    highlightRing = new THREE.Mesh(ringGeo, ringMat);
    // Ring lies flat on XZ plane (rotate to face up), hovering above the tooth
    highlightRing.rotation.x = -Math.PI / 2;
    highlightRing.position.copy(TOOTH_36_POS).add(new THREE.Vector3(0, 0.025, 0));
    teethScene.add(highlightRing);


    // Arrow line pointing down to the cavity
    const arrowStart = TOOTH_36_POS.clone().add(new THREE.Vector3(-0.04, 0.08, 0.04));
    const arrowEnd = TOOTH_36_POS.clone().add(new THREE.Vector3(0, 0.01, 0));
    const arrowGeo = new THREE.BufferGeometry().setFromPoints([arrowStart, arrowEnd]);
    const arrowMat = new THREE.LineBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.7
    });
    teethScene.add(new THREE.Line(arrowGeo, arrowMat));

    // Label sprite
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 320;
    labelCanvas.height = 80;
    const ctx = labelCanvas.getContext('2d');

    // Background
    ctx.fillStyle = 'rgba(15, 15, 30, 0.9)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 320, 80, 14);
    ctx.fill();
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, 320, 80, 14);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 26px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Tooth #36', 160, 26);
    ctx.fillStyle = '#ffaaaa';
    ctx.font = '18px Inter, Arial, sans-serif';
    ctx.fillText('Deep Carious Lesion', 160, 56);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.SpriteMaterial({
        map: labelTex,
        transparent: true,
        depthTest: false
    });
    const label = new THREE.Sprite(labelMat);
    label.position.copy(arrowStart).add(new THREE.Vector3(0, 0.015, 0));
    label.scale.set(0.12, 0.03, 1);
    teethScene.add(label);
}

function enhanceMaterial(mat) {
    if (mat.map) {
        mat.map.encoding = THREE.sRGBEncoding;
    }
    if (mat.shininess !== undefined) {
        mat.shininess = Math.max(mat.shininess, 30);
    }
}

function loadWithoutMTL(loadingEl) {
    const textureLoader = new THREE.TextureLoader();
    const teethTexture = textureLoader.load('textures/AlysonTeeth.png');
    teethTexture.encoding = THREE.sRGBEncoding;

    const loader = new THREE.OBJLoader();
    loader.load(
        'source/Teeth/Teeth.obj',
        function (object) {
            teethModel = object;

            object.traverse(function (child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        map: teethTexture,
                        shininess: 60,
                        color: 0xffffff
                    });
                }
            });

            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            teethCamera.position.set(center.x, center.y, center.z + maxDim * 1.2);
            teethControls.target.copy(center);
            teethControls.update();

            teethScene.add(object);

            // Add highlight even in fallback mode
            addToothHighlight();

            modelLoaded = true;

            if (loadingEl) {
                loadingEl.style.opacity = '0';
                setTimeout(() => { loadingEl.style.display = 'none'; }, 300);
            }
        }
    );
}
