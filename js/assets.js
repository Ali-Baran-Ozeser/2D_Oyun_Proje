// Oyun Ayarları
const TILE_SIZE = 32; 
let currentLevel = 0;
let gameState = "MENU"; 

// Sesler
const audioBGM = new Audio('./assets/audio/bgMusic.mp3');
audioBGM.loop = true;
const audioKey = new Audio('./assets/audio/keySound.mp3');
const audioWin = new Audio('./assets/audio/winSound.mp3');
const audioLose = new Audio('./assets/audio/loseSound.mp3');

let volBGM = 0.05;
let volSFX = 0.05;
audioBGM.volume = volBGM;

// Resimler
const imgWall = new Image(); imgWall.src = './assets/environment/wallgrey.png';
const imgCellDoorOpened = new Image(); imgCellDoorOpened.src = './assets/environment/celldoor2_open.png';
const imgCellDoorClosed = new Image(); imgCellDoorClosed.src = './assets/environment/celldoor2.png';
const imgGround = new Image(); imgGround.src = './assets/environment/ground.png';
const imgBlueDoor = new Image(); imgBlueDoor.src = './assets/environment/officedoorblue.png';
const imgRedDoor = new Image(); imgRedDoor.src = './assets/environment/officedoorred.png';
const imgYellowDoor = new Image(); imgYellowDoor.src = './assets/environment/officedooryellow.png';
const imgKeyBlue = new Image(); imgKeyBlue.src = './assets/environment/keyblue.png';
const imgKeyRed = new Image(); imgKeyRed.src = './assets/environment/keyred.png';
const imgKeyYellow = new Image(); imgKeyYellow.src = './assets/environment/key.png';
const imgBed = new Image(); imgBed.src = './assets/environment/bed.png';

// Listeler
let walls = [];
let cellDoors = [];
let cameras = [];
let guards = [];
let door = null;
let globalAlarmTriggered = false;
let collectibleKeys = []; 
let coloredDoors = []; 
let beds = [];