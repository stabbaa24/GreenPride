window.addEventListener('DOMContentLoaded', function () {
    document.getElementById('music').volume = 0.2;
    let popup = document.getElementById("popup");
    let btn = document.getElementById("rules");
    let span = document.getElementsByClassName("close")[0];

    btn.onclick = function() {
        popup.style.display = "block";
    }

    span.onclick = function() {
        popup.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target === popup) {
            popup.style.display = "none";
        }
    }

    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const diceTextures = [
        'img/dice/one.png',
        'img/dice/two.png',
        'img/dice/three.png',
        'img/dice/four.png',
        'img/dice/five.png',
        'img/dice/six.png'
    ];

    let currentPlayer = 0;
    const players = [];
    const challenges = [
        "Départ",
        "+3 gorgées",
        "Shot Mystère",
        "Pile ou Face",
        "-5 gorgées",
        "Péage",
        "+5 gorgées",
        "+1 shot",
        "-3 gorgées",
        "+2 shots",
        "-5 gorgées",
        "+2 shots",
        "-3 gorgées",
        "+1 shot",
        "+5 gorgées",
        "Péage",
        "-5 gorgées",
        "Pile ou Face",
        "Shot Mystère",
        "+3 gorgées",
    ];

    const tiles = [];
    let tilesOrder = [];
    const tilesImages = [
        'img/challenge/start.png',
        'img/challenge/plusThreeSlip.png',
        'img/challenge/mysteryShot.png',
        'img/challenge/pileFace.png',
        'img/challenge/minusFiveSlip.png',
        'img/challenge/peage.png',
        'img/challenge/plusFiveSlip.png',
        'img/challenge/plusOneShot.png',
        'img/challenge/minusThreeSlip.png',
        'img/challenge/plusTwoShot.png',
        'img/challenge/minusFiveSlip.png'
    ];

    let centerImg;
    let moveHistory = [];
    let moveHistoryTextBlock;

    const displayChallenge = (challengeText) => {
        const challengeStyle = new BABYLON.GUI.TextBlock();
        challengeStyle.text = challengeText;
        challengeStyle.color = "green";
        challengeStyle.fontSize = 120;
        challengeStyle.fontFamily = "Polya";
        challengeStyle.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        challengeStyle.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

        let advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        advancedTexture.addControl(challengeStyle);

        setTimeout(() => {
            advancedTexture.removeControl(challengeStyle);
        }, 2000);
    };

    const rollDice = (dice) => {
        const duration = 100;
        const initialRotation = dice.rotation.clone();
        const randomRotation = new BABYLON.Vector3(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);
        const randomNumber = Math.floor(Math.random() * 6) + 1;

        dice.material.diffuseTexture = new BABYLON.Texture(diceTextures[randomNumber - 1], scene);

        BABYLON.Animation.CreateAndStartAnimation('rollDiceAnimation', dice, 'rotation', 60, duration, initialRotation, initialRotation.add(randomRotation), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

        movePlayer(currentPlayer, randomNumber);
        currentPlayer = (currentPlayer + 1) % players.length;
    };

    const movePlayer = (playerIndex, steps) => {
        for (let i = 0; i < steps; i++) {
            setTimeout(() => {
                const player = players[playerIndex];
                player.currentTile += 1;

                if (tilesOrder && player.currentTile >= tilesOrder.length) {
                    endGame(playerIndex);
                    return;
                }

                if (tilesOrder) {
                    const nextTilePosition = tilesOrder[player.currentTile].position;

                    const moveAnimation = new BABYLON.Animation("moveAnimation", "position", 30, BABYLON.Animation
                        .ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    const keys = [];
                    keys.push({
                        frame: 0,
                        value: player.position
                    });
                    keys.push({
                        frame: 30,
                        value: new BABYLON.Vector3(nextTilePosition.x, player.position.y, nextTilePosition.z)
                    });
                    moveAnimation.setKeys(keys);

                    player.animations = [];
                    player.animations.push(moveAnimation);
                    scene.beginAnimation(player, 0, 30, false);

                    centerImg.diffuseTexture = tilesOrder[player.currentTile].material.diffuseTexture;
                }
            }, i * 1000);
        }

        setTimeout(() => {
            const currentChallengeIndex = players[playerIndex].currentTile % challenges.length;
            moveHistory.push(`Joueur ${playerIndex + 1} - Dé: ${steps}, Défi: ${challenges[currentChallengeIndex]}`);
            moveHistoryTextBlock.text = "Historique des coups:\n" + moveHistory.join("\n");
            displayChallenge(challenges[currentChallengeIndex]);
        }, steps * 1000);
    };

    const endGame = (playerIndex) => {
        const endGameText = `Joueur ${playerIndex + 1} a gagné !`;

        const endGamePanel = document.createElement("div");
        endGamePanel.className = "end-game-panel";

        const endGameTextElement = document.createElement("h2");
        endGameTextElement.innerText = endGameText;

        let restartButton = document.getElementById("restartButton");
        restartButton.style.display = "block";

        restartButton.addEventListener("click", () => {
            location.reload();
        });

        endGamePanel.appendChild(endGameTextElement);
        document.body.appendChild(endGamePanel);

        document.getElementById('rollDiceButton').disabled = true;
    };


    const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 4, 15, new BABYLON.Vector3(0, 0, 0), scene);
        camera.attachControl(canvas, true);

        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

        const board = BABYLON.MeshBuilder.CreateBox('board', {width: 6, height: 0.5, depth: 6}, scene);
        board.position.y = -1;

        const tileSize = 1;
        const tileSpacing = 0.1;
        const tilesPerRow = 6;
        const tilesPerColumn = 6;

        tilesOrder = [];
        const tiles = [];
        for (let row = 0; row < tilesPerRow; row++) {
            tiles[row] = [];
            for (let col = 0; col < tilesPerColumn; col++) {
                if (row === 0 || row === tilesPerRow - 1 || col === 0 || col === tilesPerColumn - 1) {
                    let tile = BABYLON.MeshBuilder.CreateBox(`tile_${row}_${col}`, {width: tileSize, height: 0.1, depth: tileSize}, scene);
                    tile.position.x = (row - (tilesPerRow / 2)) * (tileSize + tileSpacing) + tileSize / 2;
                    tile.position.y = -0.7;
                    tile.position.z = (col - (tilesPerColumn / 2)) * (tileSize + tileSpacing) + tileSize / 2;

                    const tileMaterial = new BABYLON.StandardMaterial(`tileMaterial_${row}_${col}`, scene);
                    tileMaterial.diffuseTexture = new BABYLON.Texture(tilesImages[(row + col) % tilesImages.length], scene);
                    tile.material = tileMaterial;

                    tiles[row][col] = tile;
                }
            }
        }

        for (let col = 0; col < tilesPerColumn; col++) {
            if (tiles[0][col]) tilesOrder.push(tiles[0][col]);
        }

        for (let row = 1; row < tilesPerRow - 1; row++) {
            if (tiles[row][tilesPerColumn - 1]) tilesOrder.push(tiles[row][tilesPerColumn - 1]);
        }

        for (let col = tilesPerColumn - 1; col >= 0; col--) {
            if (tiles[tilesPerRow - 1][col]) tilesOrder.push(tiles[tilesPerRow - 1][col]);
        }

        for (let row = tilesPerRow - 2; row > 0; row--) {
            if (tiles[row][0]) tilesOrder.push(tiles[row][0]);
        }

        const centerImageBox = BABYLON.MeshBuilder.CreateBox('centerImage', {width: tileSize * (tilesPerRow - 2), height: 0.1, depth: tileSize * (tilesPerColumn - 2)}, scene);
        centerImageBox.position.y = -0.7;

        centerImg = new BABYLON.StandardMaterial('centerImageMaterial', scene);
        centerImg.diffuseTexture = new BABYLON.Texture('img/greenPride.png', scene);
        centerImageBox.material = centerImg;

        for (let i = 0; i < 2; i++) {
            const pawn = BABYLON.MeshBuilder.CreateSphere(`pawn_${i}`, {diameter: 0.5, segments: 32}, scene);
            pawn.position.y = 0;
            pawn.position.x = -2.5 + i;
            pawn.position.z = -2.5;
            pawn.currentTile = 0;

            const pawnMaterial = new BABYLON.StandardMaterial(`pawnMaterial_${i}`, scene);
            pawnMaterial.diffuseColor = i === 0 ? new BABYLON.Color3.FromHexString("#006400") : new BABYLON.Color3.FromHexString("#8FBC8F");
            pawn.material = pawnMaterial;

            players.push(pawn);
        }

        const dice = BABYLON.MeshBuilder.CreateBox('dice', {width: 1, height: 1, depth: 1}, scene);
        dice.position.y = 0.5;
        dice.position.x = 5;
        dice.position.z = 0;

        const diceMaterial = new BABYLON.StandardMaterial('diceMaterial', scene);
        diceMaterial.diffuseTexture = new BABYLON.Texture(diceTextures[0], scene);
        dice.material = diceMaterial;

        return scene;
    };

    const scene = createScene();

    engine.runRenderLoop(function () {
        scene.render();
    });

    window.addEventListener('resize', function () {
        engine.resize();
    });

    document.getElementById('rollDiceButton').addEventListener('click', function () {
        rollDice(scene.getMeshByName('dice'));
    });
});