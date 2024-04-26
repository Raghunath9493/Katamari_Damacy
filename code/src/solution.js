import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let renderer, scene, camera, Soccer_ball;
let startButton;
let keysPressed = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, s: false, a: false, d: false, q: false, e: false };
const ballMoveSpeed = 0.5; // Speed of ball movement
const ballRotationSpeed = 0.1; // Speed of ball rotation
const ballPosition = new THREE.Vector3(0, 3, 0);
const cameraOffset = new THREE.Vector3(0, 15, 10); // Offset to maintain camera position relative to the ball
let toys = []; // To keep track of the toys in the scene
let timerElement; // To display the timer
let toyCountElement; // To display the toy count
let gameOverElement; // To display the game over title
let timerSeconds = 60; // 60-second timer
let timerInterval; // For updating the timer
let gameEnded = false; // Game state to check if the game has ended

// Define floor boundaries
const floorBounds = {
    minX: -1000,
    maxX: 1000,
    minZ: -1000,
    maxZ: 1000
};
const getRandomColor = () => {
    return Math.floor(Math.random() * 0xffffff);
};

const loadModel = (url) => new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => {
            console.error("Error loading model:", error);
            reject(error);
        }
    );
});
// Function to start the game, triggered by the "Start" button
const startGame = () => {
    startButton.remove(); // Remove the start button after the game begins

    updateToyCountDisplay(); // Initialize the toy count display
    startTimer(); // Start the game timer
};


// Function to add toys to the scene with random colors
const addToys = () => {
    const toyGeometry = new THREE.BoxGeometry(2, 2, 2);
    const numToys = 10;
    for (let i = 0; i < numToys; i++) {
        const toyMaterial = new THREE.MeshBasicMaterial({ color: getRandomColor() }); // Random color for each toy
        const posX = Math.random() * 100 - 50;
        (floorBounds.maxX - floorBounds.minX) + floorBounds.minX;
        const posY = 0.5;
        const posZ = Math.random() * 100 - 50;
        const toy = new THREE.Mesh(toyGeometry, toyMaterial);
        toy.position.set(posX, posY, posZ);
        scene.add(toy); // Add toy to the scene
        toys.push(toy); // Add to toys array
    }
};

const updateToyCountDisplay = () => {
    if (toyCountElement) {
        toyCountElement.textContent = `Toys Left: ${toys.length}`; // Display the number of toys left
    }
};

// Function to maintain a consistent camera distance
const updateCameraPosition = () => {
    const targetPosition = Soccer_ball.position.clone(); // Position of the ball
    const desiredCameraPosition = targetPosition.add(cameraOffset); // Desired camera position with offset
    camera.position.lerp(desiredCameraPosition, 0.1); // Smoothly interpolate to the desired position
    camera.lookAt(Soccer_ball.position); // Ensure the camera looks at the ball
};

// Update ball position
const updateBallPosition = () => {
    const moveVector = new THREE.Vector3(0, 0, 0);

    if (keysPressed.ArrowUp || keysPressed.w) {
        moveVector.z -= ballMoveSpeed;
        Soccer_ball.rotation.x -= ballRotationSpeed; // Rotate around X-axis
    }
    if (keysPressed.ArrowDown || keysPressed.s) {
        moveVector.z += ballMoveSpeed;
        Soccer_ball.rotation.x += ballRotationSpeed; // Rotate in the opposite direction
    }
    if (keysPressed.ArrowLeft || keysPressed.a) {
        moveVector.x -= ballMoveSpeed;
        Soccer_ball.rotation.z -= ballRotationSpeed; // Rotate around Z-axis
    }
    if (keysPressed.ArrowRight || keysPressed.d) {
        moveVector.x += ballMoveSpeed;
        Soccer_ball.rotation.z += ballRotationSpeed; // Rotate in the opposite direction
    }

    // Diagonal movement and rotations
    if (keysPressed.q) {
        moveVector.z -= ballMoveSpeed;
        moveVector.x -= ballMoveSpeed;
        Soccer_ball.rotation.x -= ballRotationSpeed;
        Soccer_ball.rotation.z -= ballRotationSpeed;
    }
    if (keysPressed.e) {
        moveVector.z -= ballMoveSpeed;
        moveVector.x += ballMoveSpeed;
        Soccer_ball.rotation.x -= ballRotationSpeed;
        Soccer_ball.rotation.z += ballRotationSpeed;
    }

    // Calculate the new position
    const newPosition = Soccer_ball.position.clone().add(moveVector);

    // Check collision with the plane (grass field)
    if (newPosition.x < floorBounds.minX || newPosition.x > floorBounds.maxX ||
        newPosition.z < floorBounds.minZ || newPosition.z > floorBounds.maxZ) {
        // Ball is trying to move out of bounds, reset its position
        newPosition.copy(Soccer_ball.position);
    }

    // Update the ball's position
    Soccer_ball.position.copy(newPosition);
    updateCameraPosition();
};

const checkCollision = () => {
    const ballBox = new THREE.Box3().setFromObject(Soccer_ball);
    for (let i = toys.length - 1; i >= 0; i--) {
        const toyBox = new THREE.Box3().setFromObject(toys[i]);
        if (ballBox.intersectsBox(toyBox)) { // If collision occurs
            const toyColor = toys[i].material.color.getHex(); // Get toy's color
            Soccer_ball.traverse((child) => {
                if (child.isMesh) {
                    child.material.color.set(toyColor); // Change ball's color
                }
            });
            scene.remove(toys[i]); // Remove toy from scene
            toys.splice(i, 1); // Remove from toys array
            updateToyCountDisplay();
        }
    }

    // Check if all toys are collected
    if (toys.length === 0) {
        gameEnded = true; // End the game
        showGameOver();
    }
};


// Function to update the timer
const updateTimerDisplay = () => {
    if (timerElement) {
        timerElement.textContent = `Time: ${timerSeconds}`; // Display remaining time
    }
};

// Function to show the game over title
const showGameOver = () => {
    clearInterval(timerInterval);
    gameEnded = true; // Set the game ended flag
    if (!gameOverElement) {
        gameOverElement = document.createElement("div");
        gameOverElement.style.position = "absolute";
        gameOverElement.style.top = "50%";
        gameOverElement.style.left = "50%";
        gameOverElement.style.transform = "translate(-50%, -50%)";
        gameOverElement.style.fontSize = "48px";
        gameOverElement.style.color = "white";
        gameOverElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        gameOverElement.style.padding = "20px";
        gameOverElement.textContent = "Game Over!";
        document.body.appendChild(gameOverElement);
    }
};

const startTimer = () => {
    timerSeconds = 60;
    timerInterval = setInterval(() => {
        if (!gameEnded) {
            timerSeconds--;
            updateTimerDisplay();

            if (timerSeconds <= 0) {
                showGameOver(); // End the game if time runs out
            }
        }
    }, 1000); // Update every second
};

const init = async() => {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, 0.5, 1000);
    try {
        Soccer_ball = await loadModel('./assets/Soccer_ball/scene.gltf');
        if (Soccer_ball) {
            Soccer_ball.scale.set(4, 4, 4);
            Soccer_ball.position.copy(ballPosition);
            Soccer_ball.visible = true;
            scene.add(Soccer_ball);

        }
    } catch (error) {
        console.error("Failed to load Soccer_ball:", error);
    }

    addToys();
    startTimer(); // Start the game timer

    // Create a text element for the timer and toy count
    timerElement = document.createElement('div');
    timerElement.style.position = 'absolute';
    timerElement.style.top = '10px';
    timerElement.style.right = '10px';
    timerElement.style.fontSize = '24px';
    timerElement.style.color = 'white';
    document.body.appendChild(timerElement);

    toyCountElement = document.createElement('div');
    toyCountElement.style.position = 'absolute';
    toyCountElement.style.top = '10px';
    toyCountElement.style.right = '100px';
    toyCountElement.style.fontSize = '24px';
    toyCountElement.style.color = 'white';
    document.body.appendChild(toyCountElement);

    updateToyCountDisplay(); // Initialize the toy count display


    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('./assets/Grass.jpg');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(100, 100);

    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMaterial = new THREE.MeshBasicMaterial({ map: grassTexture });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(-Math.PI / 2);
    // Adjust the angle by modifying the rotation values
    plane.rotateZ(Math.PI / 4); // Example rotation to create a slanted angle (tilted to the right)

    scene.add(plane);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
    scene.add(directionalLight);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Handle key presses and releases
    window.addEventListener('keydown', (e) => {
        if (!gameEnded) keysPressed[e.key] = true; // Check if the game is over
    });

    window.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    // Main render loop
    const renderLoop = () => {
        if (!gameEnded) {
            updateBallPosition(); // Update the ball's position
            checkCollision(); // Check for collisions with toys
        }
        renderer.render(scene, camera);
        requestAnimationFrame(renderLoop); // Continue the loop
    };

    renderLoop(); // Start the game loop
};

// Start the game
init();