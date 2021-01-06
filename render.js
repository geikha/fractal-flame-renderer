/**
 * Read: https://flam3.com/flame_draves.pdf for more info
 * From mega & ritchse
 */

const { vec2, mat2d } = glMatrix

const variations = {
    linear(out, p) {
        return vec2.copy(out, p)
    },
    sinusoidal(out, p) {
        const x = p[0], y = p[1]
        return vec2.set(out, Math.sin(x), Math.sin(y))
    },
    spherical(out, p) {
        return vec2.scale(out, p, 1/vec2.squaredLength(p))
    },
    swirl(out,p){
        const x = p[0], y = p[1]
        const r2 = vec2.squaredLength(p)
        const sinr2 = Math.sin(r2)
        const cosr2 = Math.sin(r2)
        return vec2.set(out, (x*sinr2)-(y*cosr2), (x*cosr2)+(y*sinr2))
    },
    horseshoe(out,p){
        const x = p[0], y = p[1]
        const r = vec2.length(p)
        const innerP = vec2.create()
        vec2.set(innerP, (x-y)*(x+y),2*x*y)
        return vec2.scale(out,innerP,1/r)
    },
    polar(out,p){
        const origin = vec2.create()
        vec2.set(origin,0,0)
        const theta = vec2.angle(origin,p)
        const r = vec2.length(p)
        return vec2.set(out, theta/Math.PI, r-1)
    },
    handkerchief(out,p){
        const origin = vec2.create()
        vec2.set(origin,0,0)
        const theta = vec2.angle(origin,p)
        const r = vec2.length(p)
        return vec2.set(out, Math.sin(theta+r), Math.cos(theta-r))
    },
    heart(out,p){
        const origin = vec2.create()
        vec2.set(origin,0,0)
        const theta = vec2.angle(origin,p)
        const r = vec2.length(p)
        const innerP = vec2.create()
        vec2.set(innerP, Math.sin(theta*r), 0-Math.cos(theta*r))
        return vec2.scale(out,innerP,r)
    },
    disc(out,p){
        const origin = vec2.create()
        vec2.set(origin,0,0)
        const theta = vec2.angle(origin,p)
        const r = vec2.length(p)
        const innerP = vec2.create()
        vec2.set(innerP, Math.sin(Math.PI*r), Math.cos(Math.PI*r))
        return vec2.scale(out,innerP,theta/r)
    },
    spiral(out,p){
        const origin = vec2.create()
        vec2.set(origin,0,0)
        const theta = vec2.angle(origin,p)
        const r = vec2.length(p)
        const innerP = vec2.create()
        vec2.set(innerP, Math.cos(theta)+Math.sin(r), Math.sin(theta)-Math.cos(r))
        return vec2.scale(out,innerP,1/r)
    },
    hyperbolic(out,p){
        const origin = vec2.create()
        vec2.set(origin,0,0)
        const theta = vec2.angle(origin,p)
        const r = vec2.length(p)
        return vec2.set(out,Math.sin(theta)/r,r*Math.cos(theta))
    },
    diamond(out,p){
        const origin = vec2.create()
        vec2.set(origin,0,0)
        const theta = vec2.angle(origin,p)
        const r = vec2.length(p)
        return vec2.set(out,Math.sin(theta)*Math.cos(r),Math.cos(theta)*Math.sin(r))
    },
    fisheye(out,p){
        const r = vec2.length(p)
        return vec2.scale(out,p,2/(r+1))
    }
}
const variationTypes = Object.keys(variations)

const fractal = {
    variations: [
        { fn: variations.sinusoidal, mat: mat2d.fromValues(0.66, 0, 0, 0.66, -0.5, -0.5), c: 0 },
        { fn: variations.sinusoidal, mat: mat2d.fromValues(0.66, 0, 0, 0.66, -0.5,  0.5), c: 0.5},
        { fn: variations.sinusoidal, mat: mat2d.fromValues(0.66, 0, 0, 0.66,  0.5, -0.5), c: 1},
    ],
    final :
        { fn: variations.linear, mat: mat2d.fromValues(1, 0, 0, 1, 0, 0), c: 1 },
    gradient :
        [[50,200,20],[0,0,255]]
}

const options = {
    pointsToGenerate : 1000,
    iterationsToSkip : 20,
    iterationsToPlot : 150,
    width : 600,
    height : 600
}

function generatePointsFor(fractal, options={}) {

    const POINTS = options.pointsToGenerate || 10000
    const SKIPPED_ITERS = options.iterationsToSkip || 20
    const PLOTTED_ITERS = options.iterationsToPlot || 200
    const WIDTH = options.width || 500
    const HEIGHT = options.height || 500
    const pointsArray = options.pointsArray || new Int32Array(WIDTH * HEIGHT)
    const colorArray = options.colorArray || new Float32Array(WIDTH * HEIGHT)

    function getRandomVariation() {
        return fractal.variations[Math.floor(Math.random()*fractal.variations.length)]
    }

    function pointIsInBounds(p) {
        const x = p[0], y = p[1]
        return -1 <= x && x <= 1
            && -1 <= y && y <= 1
    }

    function addPointToArray(p,c) {
        const x = p[0], y = p[1]
        const x_array = Math.floor((x + 1) / 2 * WIDTH)
        const y_array = Math.floor((y + 1) / 2 * HEIGHT)
        pointsArray[y_array * WIDTH + x_array]++
        colorArray[y_array * WIDTH + x_array] = c
    }

    const p = vec2.create()

    for (let i = 0; i < POINTS; i++) {
        vec2.set(p, Math.random()*2-1, Math.random()*2-1)

        for (let j = 0; j < SKIPPED_ITERS; j++) {
            const variation = getRandomVariation()
            vec2.transformMat2d(p, p, variation.mat)
            variation.fn(p, p)
        }

        for (let j = 0; j < PLOTTED_ITERS; j++) {
            const variation = getRandomVariation()
            vec2.transformMat2d(p, p, variation.mat)
            variation.fn(p, p)

            vec2.transformMat2d(p, p, fractal.final.mat)
            fractal.final.fn(p, p)

            if (pointIsInBounds(p)) {
                var c = Math.random()
                c = (c+variation.c)/2
                addPointToArray(p,c)
            }
        }
    }

    return pointsArray
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

function getColorFromGradient(index){
    const c = fractal.gradient
    const r = c[0][0] + index * (c[1][0] - c[0][0])
    const g = c[0][1] + index * (c[1][1] - c[0][1])
    const b = c[0][2] + index * (c[1][2] - c[0][2])
    return [r,g,b]
}

function render(data, width, height, pointsArray, colorArray) {
    const maxFreq = getMaxFreq(pointsArray)
    
    function setPixel(x, y, r, g, b, a=255) {
        data[y * width * 4 + x * 4 + 0] = r
        data[y * width * 4 + x * 4 + 1] = g
        data[y * width * 4 + x * 4 + 2] = b
        data[y * width * 4 + x * 4 + 3] = a
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const freq = pointsArray[y * width + x]
            const alpha = Math.log(freq) / maxFreq * 256
            const cindex = colorArray[y * width + x]
            const color = getColorFromGradient(cindex)
            setPixel(x, y, color[0], color[1], color[2], alpha)
        }
    }

}

function initRendering() {
    const canvas = document.getElementById('output')
    const ctx = canvas.getContext('2d')
    const CANVAS_WIDTH = canvas.width
    const CANVAS_HEIGHT = canvas.height

    const pointsArray = new Int32Array(CANVAS_WIDTH * CANVAS_HEIGHT)
    const colorArray = new Float32Array(CANVAS_WIDTH * CANVAS_HEIGHT)
    const clear = () => pointsArray.fill(0)
    const image = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT)
    options.pointsArray = pointsArray
    options.colorArray = colorArray

    setInterval(() => {
        generatePointsFor(fractal, options)
        render(image.data, CANVAS_WIDTH, CANVAS_HEIGHT, options.pointsArray, options.colorArray)
    }, 20)

    function drawToScreen() {
        ctx.putImageData(image, 0, 0)
        requestAnimationFrame(drawToScreen)
    }
    drawToScreen()

    return clear
}

function optionsFolder(gui,clear){
    const folder = gui.addFolder(`options`);
    folder.add(options,"pointsToGenerate",100,20000,100).name("points amt").onChange(clear)
    folder.add(options,"iterationsToSkip",0,300,10).name("skipped iterations").onChange(clear)
    folder.add(options,"iterationsToPlot",50,1000,50).name("iterations").onChange(clear)
    //folder.add(options,"width",100,3840,10).onChange(clear)
    //folder.add(options,"height",100,3840,10).onChange(clear)
}

function variationFolder(gui, variation, i, clear) {
	const folder = gui.addFolder(`Variation ${i}`);

	folder
		.add(variation, "fn")
		.name("Type")
		.options(variationTypes)
		.onChange((type) => {
			variation.fn = variations[type];
			clear();
		});

	folder.add(variation.mat, 0, -10, 10, 0.005).name("a").onChange(clear);
	folder.add(variation.mat, 1, -10, 10, 0.005).name("b").onChange(clear);
	folder.add(variation.mat, 3, -10, 10, 0.005).name("c").onChange(clear);
	folder.add(variation.mat, 4, -10, 10, 0.005).name("d").onChange(clear);
	folder.add(variation.mat, 4, -2, 2, 0.005).name("tx").onChange(clear);
    folder.add(variation.mat, 5, -2, 2, 0.005).name("ty").onChange(clear);

	const buttons = {
        reset: function(){
            fractal.final =  { fn: variations.linear, mat: mat2d.fromValues(1, 0, 0, 1, 0, 0) }
            gui.hide()
            initGUI(clear)
        },
		remove: function () {
            fractal.variations.splice(i,1)
            gui.hide()
			initGUI(clear)
		}
    };
    folder.add(buttons,'reset').onChange(clear)
    folder.add(buttons,'remove').onChange(clear)
}

function buildFolders(gui,clear){
    for (let i = 0; i < fractal.variations.length; i++) {
        const variation = fractal.variations[i]
        variationFolder(gui,variation,i,clear)
    }
}

function initGUI(clear) {
    const gui = new dat.GUI()

    optionsFolder(gui,clear)
    buildFolders(gui,clear)
    variationFolder(gui,fractal.final,"FINAL",clear)
    
    const adding = { 
        add: function(){
            variation = { fn: variations.sinusoidal, mat: mat2d.fromValues(0.66, 0, 0, 0.66, -0.5, -0.5) }
            fractal.variations.push(variation)
            gui.hide()
            initGUI(clear)
        }
    }
    gui.add(adding,'add').onChange(clear)
}

document.addEventListener('DOMContentLoaded', () => {
    const clearFractal = initRendering()
    initGUI(clearFractal)

})