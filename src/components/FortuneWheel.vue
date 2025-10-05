<template>
  <div class="wheel">
      <header class="app__header">
        <img src="../img/image.png" alt="Логотип" class="app__logo" />
    </header>
    <canvas ref="wheelCanvas" width="500" height="500" class="wheel__canvas"></canvas>
    <div class="wheel__controls">
      <button
        class="wheel__btn"
        :class="{ 'wheel__btn--disabled': spinning || filledCount < 2 }"
        :disabled="spinning || filledCount < 2"
        @click="spinWheel"
      >
        {{ spinning ? 'Крутится...' : 'Крутить колесо' }}
      </button>

      <p v-if="filledCount < 2" class="wheel__warning">
        Добавьте хотя бы 2 участника, чтобы крутить колесо
      </p>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue"
import confetti from "canvas-confetti"
import { shortText } from "../utils/text.js"

const props = defineProps({ sectors: { type: Array, required: true } })
const emit = defineEmits(["winner"])

const wheelCanvas = ref(null)
const spinning = ref(false)
const angle = ref(0)
const highlightIndex = ref(null)


let animId = null
let pulseStart = null
let velocity = 0
let prevIndex = 0
let highlightTimeout = null

const filledCount = computed(() =>
  props.sectors.filter(s => s && s.trim()).length
)



// ====== Рисуем колесо ======

function drawWheel() {
  const canvas = wheelCanvas.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const radius = Math.min(width, height) / 2;
  const cx = width / 2;
  const cy = height / 2;
  const n = props.sectors.length || 1;
  const sectorAngle = (2 * Math.PI) / n;
  const now = performance.now();

  // === Очистка холста ===
  ctx.clearRect(0, 0, width, height);
  ctx.save();

  // === Мягкая тень под всем колесом ===
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.98, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fill();
  ctx.restore();

  // === Цветовая палитра ===
  const kidColors = [
    "#b77dd4", // сиреневый
    "#35c1d2", // голубой
    "#d4487d", // розовый
    "#d37f50", // оранжевый
    "#9ed34d", // зелёный
  ];

  // === Основной цикл по секторам ===
  for (let i = 0; i < n; i++) {
    const start = i * sectorAngle + angle.value;
    const end = start + sectorAngle;

    // Подбор цвета (без повторов подряд)
    let colorIndex = i % kidColors.length;
    if (i > 0 && kidColors[colorIndex] === kidColors[(i - 1) % kidColors.length]) {
      colorIndex = (colorIndex + 1) % kidColors.length;
    }
    const baseColor = kidColors[colorIndex];

    // === Градиент с плавным переходом ===
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
    grad.addColorStop(0, "#ffffffcc");
    grad.addColorStop(0.3, `${baseColor}cc`);
    grad.addColorStop(1, baseColor);

    // === Эффект освещения по кругу ===
    const lightAngle = Math.PI / 4;
    const highlight = Math.cos(start - lightAngle) * 0.15 + 0.85;
    ctx.globalAlpha = highlight;

    // === Пульсация выделенного сектора ===
    // let scale = 1, rotationOffset = 0;
    // if (highlightIndex.value === i) {
    //   const pulse = 0.97 + 0.05 * Math.sin((now - pulseStart) / 300);
    //   const rotation = 0.02 * Math.sin((now - pulseStart) / 500);
    //   scale = pulse;
    //   rotationOffset = rotation;
    //   ctx.save();
    //   ctx.translate(cx, cy);
    //   ctx.rotate(rotationOffset);
    //   ctx.scale(scale, scale);
    //   ctx.translate(-cx, -cy);
    // }

    // === Отрисовка сектора ===
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.shadowBlur = 5;
    ctx.fill();

    // === Граница сектора ===
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff88";
    ctx.stroke();

    if (highlightIndex.value === i) ctx.restore();
    ctx.globalAlpha = 1;

    // === Добавляем блик сверху сектора ===
    const shine = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
    shine.addColorStop(0, "rgba(255,255,255,0.15)");
    shine.addColorStop(0.5, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fill();

    // === Текст сектора ===
    ctx.save();
    ctx.translate(cx, cy);
    const mid = start + sectorAngle / 2;
    ctx.rotate(mid);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const baseFont = Math.max(12, Math.min(22, Math.floor(radius * 0.08)));
    ctx.font = `600 ${baseFont}px Poppins, Arial, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.fillText(shortText(props.sectors[i] || ""), radius - 24, 0);
    ctx.restore();
  }

  // === Центр колеса ===
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.2);
  centerGrad.addColorStop(0, "#ffffffee");
  centerGrad.addColorStop(1, "#ffffff1a");
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.15, 0, 2 * Math.PI);
  ctx.fillStyle = centerGrad;
  ctx.shadowColor = "rgba(0,0,0,0.10)";
  ctx.shadowBlur = 8;
  ctx.fill();

  // === Стрелка ===
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - radius - 6);
  ctx.lineTo(cx + 14, cy - radius - 6);
  ctx.lineTo(cx, cy - radius + 26);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffffaa";
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}
// ====== Подсветка победителя ======
function startHighlight(index) {
  highlightIndex.value = index
  pulseStart = performance.now()
  if (highlightTimeout) clearTimeout(highlightTimeout)
  highlightTimeout = setTimeout(stopHighlight, 3000)
}

function stopHighlight() {
  highlightIndex.value = null
  pulseStart = null
  drawWheel()
}

// ====== Выбор победителя ======
function pickWinner() {
  const n = props.sectors.length
  const sectorAngle = (2 * Math.PI) / n
  const pointerAngle = 3 * Math.PI / 2
  const normalized = ((pointerAngle - angle.value + 2 * Math.PI) % (2 * Math.PI))
  const index = Math.floor(normalized / sectorAngle) % n
  const winner = props.sectors[index] || "Без имени"

function launchConfetti() {
  setTimeout(() => {
    confetti({
      particleCount: 180,
      spread: 110,
      origin: { y: 0.58 }
    })
  }, 1000) // задержка 2 секунды
}

  emit("winner", winner)
  startHighlight(index)
  launchConfetti()
  
}
// Создаем контекст Web Audio один раз
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

function playTick() {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const noise = audioCtx.createBufferSource();
  const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.03, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);

  // заполняем буфер шумом
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.2; // интенсивность шума
  }

  noise.buffer = noiseBuffer;
  noise.loop = false;

  // основной осциллятор
  osc.type = 'square';
  osc.frequency.setValueAtTime(2000, audioCtx.currentTime);

  // резкий спад громкости
  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);

  // подключаем осциллятор и шум к одному узлу
  const merger = audioCtx.createGain();
  osc.connect(merger);
  noise.connect(merger);
  merger.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.02);
  noise.start();
}


function spinWheel() {
  if (spinning.value || filledCount.value < 2) return

  spinning.value = true
  highlightIndex.value = null
  if (highlightTimeout) clearTimeout(highlightTimeout)

  const n = props.sectors.length
  const sectorAngle = (2 * Math.PI) / n

  // prevIndex = Math.floor(((3 * Math.PI / 2 - angle.value + 2 * Math.PI) % (2 * Math.PI)) / n)
prevIndex = Math.floor(((3 * Math.PI / 2 - angle.value + 2 * Math.PI) % (2 * Math.PI)) / sectorAngle)

  // Начальная скорость
  velocity = (Math.random() * 0.03 + 0.03) * 2 * Math.PI  // 0.03–0.06 * 2π
  const friction = 0.998
  const minVelocity = 0.0015

  function animate() {
    angle.value += velocity
    angle.value %= 2 * Math.PI
    velocity *= friction

    // Щелчок при смене сектора
    const currentIndex = Math.floor(((3 * Math.PI / 2 - angle.value + 2 * Math.PI) % (2 * Math.PI)) / sectorAngle)
    if (currentIndex !== prevIndex) {
      prevIndex = currentIndex
      playTick() // Web Audio мгновенный щелчок
    }

    drawWheel()

    if (velocity > minVelocity) {
      animId = requestAnimationFrame(animate)
    } else {
      spinning.value = false
      pickWinner()
    }
  }

  animId = requestAnimationFrame(animate)
}



onMounted(() => drawWheel())

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  if (highlightTimeout) clearTimeout(highlightTimeout)
})

watch(
  () => props.sectors,
  () => drawWheel(),
  { deep: true }
)

defineExpose({drawWheel})
</script>

<style scoped>

.wheel__canvas{
  border: 8px solid rgb(153, 131, 4);  /* рамка */
  border-radius: 50%;       /* круглая */
  box-sizing: border-box;   
  box-shadow: 0 0 20px 5px gold, 0 0 40px 10px rgba(255,200,0,0.5);
  filter: drop-shadow(0 0 10px rgba(0,0,0,0.4));

}
</style>
