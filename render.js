/**
 * Read: https://flam3.com/flame_draves.pdf for more info
 * From mega & ritchse
 *
 * Colormaps from: https://github.com/tritoke/libcmap/tree/master/colourmaps
 */

const { vec2, vec3, mat2d } = glMatrix

const variations = {
    linear(out, p) {
        return vec2.copy(out, p)
    },
    sinusoidal(out, p) {
        const x = p[0], y = p[1]
        return vec2.set(out, Math.sin(x), Math.sin(y))
    },
    spherical(out, p) {
        return vec2.scale(out, p, 1 / vec2.squaredLength(p))
    },
    swirl(out, p) {
        const x = p[0], y = p[1]
        const r2 = vec2.squaredLength(p)
        const sinr2 = Math.sin(r2)
        const cosr2 = Math.sin(r2)
        return vec2.set(out, (x * sinr2) - (y * cosr2), (x * cosr2) + (y * sinr2))
    },
    horseshoe(out, p) {
        const x = p[0], y = p[1]
        const r = vec2.length(p)
        vec2.set(out, (x - y) * (x + y), 2 * x * y)
        return vec2.scale(out, out, 1 / r)
    },
    polar(out, p) {
        const x = p[0], y = p[1]
        const theta = Math.atan2(y, x)
        const r = vec2.length(p)
        return vec2.set(out, theta / Math.PI, r - 1)
    },
    handkerchief(out, p) {
        const x = p[0], y = p[1]
        const theta = Math.atan2(y, x)
        const r = vec2.length(p)
        return vec2.set(out, Math.sin(theta + r), Math.cos(theta - r))
    },
    heart(out, p) {
        const x = p[0], y = p[1]
        const theta = Math.atan2(y, x)
        const r = vec2.length(p)
        vec2.set(out, Math.sin(theta * r), -Math.cos(theta * r))
        return vec2.scale(out, out, r)
    },
    disc(out, p) {
        const x = p[0], y = p[1]
        const theta = Math.atan2(y, x)
        const r = vec2.length(p)
        vec2.set(out, Math.sin(Math.PI * r), Math.cos(Math.PI * r))
        return vec2.scale(out, out, theta / r)
    },
    spiral(out, p) {
        const x = p[0], y = p[1]
        const theta = Math.atan2(y, x)
        const r = vec2.length(p)
        vec2.set(out, Math.cos(theta) + Math.sin(r), Math.sin(theta) - Math.cos(r))
        return vec2.scale(out, out, 1 / r)
    },
    hyperbolic(out, p) {
        const x = p[0], y = p[1]
        const theta = Math.atan2(y, x)
        const r = vec2.length(p)
        return vec2.set(out, Math.sin(theta) / r, r * Math.cos(theta))
    },
    diamond(out, p) {
        const x = p[0], y = p[1]
        const theta = Math.atan2(y, x)
        const r = vec2.length(p)
        return vec2.set(out, Math.sin(theta) * Math.cos(r), Math.cos(theta) * Math.sin(r))
    },
    fisheye(out, p) {
        const r = vec2.length(p)
        return vec2.scale(out, p, 2 / (r + 1))
    },
    julia(out, p) {
        const x = p[0], y = p[1]
        const theta = Math.atan2(y, x)
        const sqrt_r = Math.sqrt(vec2.length(p))
        const ohm = Math.floor(Math.random() * 2) * Math.PI
        const arg = theta/2 + ohm
        return vec2.set(out, sqrt_r * Math.cos(arg), Math.sin(arg))
    }
}
const variationTypes = Object.keys(variations)

function randomVariation(){
  const keys = Object.keys(variations);
  return variations[keys[ keys.length * Math.random() << 0]];  //it just... works
}

function randomMat2d(){
  const rand = ()=> (Math.random()*4)-2
  return mat2d.fromValues(rand(), rand(), rand(), rand(), rand(), rand()) 
}

function randomColormapName() {
    return colormaps[Math.floor(Math.random() * colormaps.length)]
}

const fractal = {
    variations: [
        { fn: randomVariation(), mat: randomMat2d(), c: 0 },
        { fn: randomVariation(), mat: randomMat2d(), c: 0.5 },
        { fn: randomVariation(), mat: randomMat2d(), c: 1 },
    ],
    /* NOTE: Currently final transform color is not used */
    final: { fn: variations.linear, mat: mat2d.fromValues(1, 0, 0, 1, 0, 0), c: 1 },
    //colormap: [vec3.fromValues(0.1, 1, 1), vec3.fromValues(1, 0, 0), vec3.fromValues(0.1, 0.4, 1)]
    colormap: [vec3.fromValues(1, 1, 1), vec3.fromValues(1, 1, 1)],
    colormapName: 'White'
}

function getColorAt(out, cindex, colormap) {
    const idx = cindex * (colormap.length - 1)
    const idx_left = Math.floor(idx)
    const color_left = colormap[idx_left]

    if (idx === idx_left) {
        return color_left
    }

    const idx_right = Math.ceil(idx)
    const color_right = colormap[idx_right]

    const bias = (idx - idx_left) / (idx_right - idx_left)

    return vec3.lerp(out, color_left, color_right, bias)
}

const options = {
    pointsToGenerate: 1000,
    iterationsToSkip: 20,
    iterationsToPlot: 150,
    width: 1000,
    height: 1000,
    interval: 20
}

function generatePointsFor(fractal, options = {}) {
    const POINTS = options.pointsToGenerate || 10000
    const SKIPPED_ITERS = options.iterationsToSkip || 20
    const PLOTTED_ITERS = options.iterationsToPlot || 200
    const WIDTH = options.width || 500
    const HEIGHT = options.height || 500
    const pointsArray = options.pointsArray || new Int32Array(WIDTH * HEIGHT)
    const colorArray = options.colorArray || new Float32Array(WIDTH * HEIGHT * 3)

    function getRandomVariation() {
        return fractal.variations[Math.floor(Math.random() * fractal.variations.length)]
    }

    function pointIsInBounds(p) {
        const x = p[0], y = p[1]
        return -1 <= x && x <= 1
            && -1 <= y && y <= 1
    }

    const color = vec3.create()
    function addPointToArray(p, c) {
        const x = p[0], y = p[1]
        const x_array = Math.floor((x + 1) / 2 * WIDTH)
        const y_array = Math.floor((y + 1) / 2 * HEIGHT)
        pointsArray[y_array * WIDTH + x_array]++
        getColorAt(color, c, fractal.colormap)
        const color_array_idx = y_array * WIDTH * 3 + x_array * 3
        colorArray[color_array_idx + 0] += color[0]
        colorArray[color_array_idx + 1] += color[1]
        colorArray[color_array_idx + 2] += color[2]
    }

    const p = vec2.create()
    const plotted_p = vec2.create()
    let c = Math.random()

    for (let i = 0; i < POINTS; i++) {
        vec2.set(p, Math.random() * 2 - 1, Math.random() * 2 - 1)

        for (let j = 0; j < SKIPPED_ITERS; j++) {
            const variation = getRandomVariation()
            vec2.transformMat2d(p, p, variation.mat)
            variation.fn(p, p)
        }

        for (let j = 0; j < PLOTTED_ITERS; j++) {
            const variation = getRandomVariation()
            vec2.transformMat2d(p, p, variation.mat)
            variation.fn(p, p)
            c = (c + variation.c) / 2

            vec2.transformMat2d(plotted_p, p, fractal.final.mat)
            fractal.final.fn(plotted_p, plotted_p)

            if (pointIsInBounds(plotted_p)) {
                addPointToArray(plotted_p, c)
            }
        }
    }

    return { pointsArray, colorArray }
}

function getMaxFreq(pointsArray) {
    let maxFreq = 0
    for (let i = 0; i < pointsArray.length; i++) {
        const freq = pointsArray[i]
        if (freq > maxFreq) {
            maxFreq = freq
        }
    }
    return Math.log(maxFreq)
}

function render(data, options) {
    const { width, height, pointsArray, colorArray } = options
    const color = vec3.create()
    const maxFreq = getMaxFreq(pointsArray)

    function setPixel(x, y, r, g, b, a = 255) {
        data[y * width * 4 + x * 4 + 0] = r
        data[y * width * 4 + x * 4 + 1] = g
        data[y * width * 4 + x * 4 + 2] = b
        data[y * width * 4 + x * 4 + 3] = a
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel_idx = y * width + x
            const freq = pointsArray[pixel_idx]
            const color_array_idx = y * width * 3 + x * 3
            const r = colorArray[color_array_idx + 0] / freq
            const g = colorArray[color_array_idx + 1] / freq
            const b = colorArray[color_array_idx + 2] / freq
            const alpha = Math.log(freq) / maxFreq * 255
            setPixel(x, y, r * 255, g * 255, b * 255, alpha)
        }
    }

}

function initRendering() {
    const canvas = document.getElementById('output')
    const ctx = canvas.getContext('2d')

    function createResources() {
        const width = canvas.width = options.width
        const height = canvas.height = options.height

        const pointsArray = new Int32Array(width * height)
        const colorArray = new Float32Array(width * height * 3)
        const image = ctx.createImageData(width, height)

        return [pointsArray, colorArray, image]
    }

    function improveRender() {
        generatePointsFor(fractal, options)
        render(image.data, options)
    }

    let image
    [options.pointsArray, options.colorArray, image] = createResources()
    let intervalID = setInterval(improveRender, options.interval)

    let requestAnimationFrameID
    function drawToScreen() {
        ctx.putImageData(image, 0, 0)
        requestAnimationFrameID = requestAnimationFrame(drawToScreen)
    }
    drawToScreen()

    const renderingController = {
        clearBuffers() {
            options.pointsArray.fill(0)
            options.colorArray.fill(0)
        },

        canvasResolutionChanged() {
            [options.pointsArray, options.colorArray, image] = createResources()
        },

        updateIntervalChanged() {
            clearInterval(intervalID)
            intervalID = setInterval(improveRender, options.interval)
        }
    }

    return renderingController
}

function optionsFolder(gui, renderingController) {
    const folder = gui.addFolder(`options`);
    folder.add(options, 'pointsToGenerate', 100, 20000, 100).name('points amt')
    folder.add(options, 'iterationsToSkip', 0, 300, 10).name('skipped iterations')
    folder.add(options, 'iterationsToPlot', 50, 1000, 50).name('iterations')

    folder.add(options, 'width', 100, 3840, 10).onChange(renderingController.canvasResolutionChanged)
    folder.add(options, 'height', 100, 3840, 10).onChange(renderingController.canvasResolutionChanged)
    folder.add(options, 'interval', 0, 2000, 5)
        .name('interval in ms').onChange(renderingController.updateIntervalChanged)
    folder.addColor(document.body.style, 'backgroundColor').name('background color')
}

function variationFolder(gui, variation, i, renderingController) {
    const folder = gui.addFolder(`Variation ${i}`)
    const clear = renderingController.clearBuffers

    folder
        .add(variation, 'fn')
        .name('Type')
        .options(variationTypes)
        .onChange((type) => {
            variation.fn = variations[type]
            clear()
        })

    folder.add(variation.mat, 0, -10, 10, 0.005).name('a').onChange(clear)
    folder.add(variation.mat, 1, -10, 10, 0.005).name('b').onChange(clear)
    folder.add(variation.mat, 2, -10, 10, 0.005).name('c').onChange(clear)
    folder.add(variation.mat, 3, -10, 10, 0.005).name('d').onChange(clear)
    folder.add(variation.mat, 4, -2, 2, 0.005).name('tx').onChange(clear)
    folder.add(variation.mat, 5, -2, 2, 0.005).name('ty').onChange(clear)
    if (i !== 'FINAL') {
        folder.add(variation, 'c', 0, 1, 0.005).name('color').onChange(clear)
    }

    const buttons = {
        reset() {
            variation.fn = variations.linear
            variation.mat = mat2d.fromValues(1, 0, 0, 1, 0, 0)
            variation.c = 0
            gui.destroy()
            initGUI(renderingController)
        },
        remove() {
            fractal.variations.splice(i, 1)
            gui.destroy()
            initGUI(renderingController)
        }
    };
    folder.add(buttons, 'reset').onChange(clear)

    if (i !== 'FINAL') {
        folder.add(buttons, 'remove').onChange(clear)
    }
}

function buildFolders(gui, renderingController) {
    for (let i = 0; i < fractal.variations.length; i++) {
        const variation = fractal.variations[i]
        variationFolder(gui, variation, i, renderingController)
    }
}

function initGUI(renderingController) {
    const gui = new dat.GUI()

    optionsFolder(gui, renderingController)
    buildFolders(gui, renderingController)
    variationFolder(gui, fractal.final, 'FINAL', renderingController)

    const adding = {
        add() {
            variation = { fn: variations.linear, mat: mat2d.fromValues(1, 0, 0, 1, 0, 0), c: 0 }
            fractal.variations.push(variation)
            gui.destroy()
            initGUI(renderingController)
        }
    }
    gui.add(adding, 'add').onChange(renderingController.clearBuffers)

    async function changeColormap(colormapName) {
        try {
            fractal.colormap = await colormap.fromURL(`./colormaps/${colormapName}.cmap`)
            renderingController.clearBuffers()
        } catch (error) {
            console.error(error)
        }
    }
    gui.add(fractal, 'colormapName')
        .name('Color Palette').options(colormaps)
        .onChange(changeColormap)
}

function randomBackground() {
	if (Math.random() < 0.65) {
		document.body.style.backgroundColor = "#000000";
	} else {
		document.body.style.backgroundColor = "#FFFFFF";
	}
}

document.addEventListener("DOMContentLoaded", async () => {
	fractal.colormapName = randomColormapName();
	fractal.colormap = await colormap.fromURL(
		`./colormaps/${fractal.colormapName}.cmap`
	);
	const clearFractal = initRendering();
	initGUI(clearFractal);
	randomBackground();
});