<template>
  <div class="app">
    <header class="app__header">
      <!-- <h1 class="app__title">Колесо фортуны</h1> -->
    </header>

    <div class="app__main">
      <!-- Левая колонка: колесо -->
      <section class="app__wheel-column">
        <FortuneWheel
          ref="wheelCanvas"
          :sectors="sectors"
          @winner="delayedShowWinner($event)"
        />
      </section>

      <!-- Правая колонка: управление и участники -->
      <aside class="app__controls-column">
        <!-- Количество участников -->
        <div class="control control--count">
          <input 
            type="number"
            v-model.number="participantCount"
            min="2"
            class="control__input"
          />
          <button class="control__btn" @click="setParticipantCount">
            Подтвердить
          </button>
        </div>

        <!-- Добавление участников -->
        <div v-if="sectors.length" class="control control--add">
          <input
            type="text"
            v-model="newName"
            placeholder="Введите имя участника"
            @keyup.enter="addName"
            class="control__input"
          />
          <button class="control__btn" @click="addName">Добавить</button>
        </div>

        <!-- Список участников -->
        <ParticipantsList v-if="sectors.length" :sectors="sectors" />
      </aside>
    </div>

    <!-- Попап победителя -->
    <div v-if="winner" class="winner-popup" @click="winner = null">
      <div class="winner-popup__content">
        🎉 Победитель: <strong>{{ winner }}</strong> 🎉
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import ParticipantsList from "./components/ParticipantsList.vue"
import FortuneWheel from "./components/FortuneWheel.vue"

const participantCount = ref(10)
const sectors = ref(Array(10).fill(""))
const newName = ref("")
const winner = ref(null)
const wheelCanvas = ref(null)

// Установка количества участников
function setParticipantCount() {
  if (!participantCount.value || participantCount.value < 2) return
  sectors.value = Array(participantCount.value).fill("")
  winner.value = null
  wheelCanvas.value?.drawWheel()
}

// Добавление имени участника
function addName() {
  const name = newName.value.trim()
  if (!name) return
  const idx = sectors.value.findIndex((s) => !s)
  if (idx === -1) return
  sectors.value.splice(idx, 1, name)
  newName.value = ""
  wheelCanvas.value?.drawWheel()
}

// Задержка перед показом победителя (для эффекта)
function delayedShowWinner(name) {
  setTimeout(() => {
    showWinner(name)
  }, 1000)
}

// Показ победителя
function showWinner(name) {
  winner.value = name
}

// Отрисовка колеса при монтировании
onMounted(() => {
  wheelCanvas.value?.drawWheel()
})
</script>
