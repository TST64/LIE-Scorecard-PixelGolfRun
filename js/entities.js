class AnimatedSprite
{
    constructor(frames, pixelSize)
    {
        this.frames = frames;
        this.pixelSize = pixelSize;
        this.currentFrame = 0;
        this.tickCount = 0;
        this.ticksPerFrame = 6;
    }

    update()
    {
        this.tickCount++;
        if (this.tickCount > this.ticksPerFrame)
        {
            this.tickCount = 0;
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        }
    }

    draw(ctx, x, y)
    {
        const frame = this.frames[this.currentFrame];
        for (let row = 0; row < frame.length; row++)
        {
            for (let col = 0; col < frame[row].length; col++)
            {
                let colorIndex = frame[row][col];
                if (colorIndex !== 0)
                {
                    ctx.fillStyle = colorPalette[colorIndex];
                    let drawX = x + (col * this.pixelSize);
                    let drawY = y + (row * this.pixelSize);
                    ctx.fillRect(drawX, drawY, this.pixelSize, this.pixelSize);
                }
            }
        }
    }
}

// ObstacleTypes definieren (Nutzt Daten aus sprites.js und config.js)
const obstacleTypes = [
    { type: "single", sprite: new AnimatedSprite([flagFrame1, flagFrame2], pixelScale), flying: false, damage: 25 },
    { type: "single", sprite: new AnimatedSprite([cartFrame1, cartFrame2], pixelScale), flying: false, damage: 50 },
    { type: "single", sprite: new AnimatedSprite([treeFrame], pixelScale), flying: false, damage: 25 },
    { type: "single", sprite: new AnimatedSprite([otherGolferFrame1, otherGolferFrame2], pixelScale), flying: false, damage: 25 },
    { type: "single", sprite: new AnimatedSprite([birdFrame1, birdFrame2], pixelScale), flying: true, damage: 15 },
    { type: "bunker", flying: false, damage: 35 },
    { type: "water", flying: false, damage: 35 }
];

function createObstacle(startX)
{
    let randomIndex = Math.floor(Math.random() * obstacleTypes.length);
    let selectedType = obstacleTypes[randomIndex];

    let newObstacle = {
        x: startX,
        y: 130,
        width: objSize,
        height: objSize,
        sprites: [],
        flying: selectedType.flying,
        damage: selectedType.damage
    };

    if (selectedType.type === "bunker")
    {
        let middleCount = Math.floor(Math.random() * 3);
        newObstacle.sprites.push(new AnimatedSprite([bunkerLeft], pixelScale));
        for (let i = 0; i < middleCount; i++)
        {
            newObstacle.sprites.push(new AnimatedSprite([bunkerMiddle], pixelScale));
        }
        newObstacle.sprites.push(new AnimatedSprite([bunkerRight], pixelScale));

        newObstacle.width = newObstacle.sprites.length * objSize;
        newObstacle.y = 130;
    }
    else if (selectedType.type === "water")
    {
        let middleCount = Math.floor(Math.random() * 3);
        newObstacle.sprites.push(new AnimatedSprite([waterLeft], pixelScale));
        for (let i = 0; i < middleCount; i++)
        {
            newObstacle.sprites.push(new AnimatedSprite([waterMiddle], pixelScale));
        }
        newObstacle.sprites.push(new AnimatedSprite([waterRight], pixelScale));

        newObstacle.width = newObstacle.sprites.length * objSize;
        newObstacle.y = 130;
    }
    else
    {
        newObstacle.sprites.push(selectedType.sprite);

        let frame = selectedType.sprite.frames[0];
        let cols = frame[0].length;
        let rows = frame.length;

        newObstacle.width = cols * pixelScale;
        newObstacle.height = rows * pixelScale;

        if (selectedType.flying)
        {
            newObstacle.y = 85;
        }
        else
        {
            newObstacle.y = 170 - newObstacle.height;
        }
    }

    return newObstacle;
}