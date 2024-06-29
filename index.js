// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js" 
import { getDatabase, ref, push, onValue, remove, update} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"


// Global variables 
// - Pages
const nameInputPage = document.getElementById("name-input-page")
const mainPage = document.getElementById("main-page")

// - Adding sets
const addSetsBtn = document.getElementById("add-a-set-btn")
const allSetsRow = document.querySelector(".add-sets-row")

// - Editing workout details
const editNameInputEl = document.getElementById("edit-name-input")
const editDescriptionInputEl = document.getElementById("edit-workout-description-input")
const editWorkoutPopUpEl = document.getElementById("edit-workout-popup")

// - Workout and session galleries
const workoutCardGalleryEl = document.getElementById("workout-card-gallery")
const sessionGalleryEl = document.getElementById("session-gallery")

// - Adding new workouts
const newWorkoutBtn = document.getElementById("new-workout-btn")

// - Popups
const darkenLayerEl = document.getElementById("darken-layer")
const popupManagementEl = document.getElementById("popup-management")
const addWorkoutPopUpEl = document.getElementById("add-workout-popup")
const exitBtn = document.getElementById("exit-img")


// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Code for formatting AM and PM times obtained from StackOverFlow
// - Link: https://stackoverflow.com/a/8888498
function formatAMPM(date) {
    var hours = date.getHours()
    var minutes = date.getMinutes()
    var ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes
    var strTime = hours + ':' + minutes + ' ' + ampm
    return strTime
}

// Managing the start page
function renderWelcomePage() {
    const welcomePage = document.getElementById("welcome-message-page")
    const welcomeText = document.getElementById("welcome-text")

    nameInputPage.style.display = "none"
    welcomePage.style.display = "block"
    const welcomeMessage = `
        <h1 id="welcome-text">
            Welcome back, ${localStorage.getItem("gymapp_name")} ✨
        </h1>
    `
    welcomeText.innerHTML = welcomeMessage

    sleep(2000).then(() => { 
        welcomePage.style.display = "none"
        mainPage.style.display = "block"
    })
}
// - Check if user data exists to render welcome page or enter name page
if (localStorage.getItem("gymapp_name")) {
    renderWelcomePage()
} else {
    const enterNameBtn = document.getElementById("enter-name-btn")
    const nameInputEl = document.getElementById("name-input")

    nameInputPage.style.display = "block"
    enterNameBtn.addEventListener("click", function() {
        if (nameInputEl.value) {
            console.log("Clicked enter name button")
            
            const name = nameInputEl.value
            localStorage.setItem("gymapp_name", name)      
    
            // Generate random numbers to add to unique identifier
            const randomNumber = Math.ceil(Math.random() * 10000)
            const nameID = name + "-" + randomNumber 

            localStorage.setItem("gymapp_nameid", nameID)
            renderWelcomePage()
            location.reload()   // First refresh to be able to add workout cards 
        }
    })
}

// TODO: DO NOT ADD TO GITHUB WITH THE DATABASE URL
// TODO: CHANGE SECURITY RULES FOR FIREBASE DATABASE https://firebase.google.com/docs/rules/insecure-rules
const appSettings = {
    databaseURL: "https://gym-app-3ab22-default-rtdb.firebaseio.com/"
}
const nameID = localStorage.getItem("gymapp_nameid")

const app = initializeApp(appSettings) 
const database = getDatabase(app)
const userDB = ref(database, nameID)
const userLoggedSessionsDBName = `${nameID}-loggedsessions`
const userLoggedSessionsDB = ref(database, userLoggedSessionsDBName)

// Managing buttons
newWorkoutBtn.addEventListener("click", function() {   
    console.log("New workout button clicked")
    openPopUp()
    addWorkoutPopUpEl.style.display = "block"
})

exitBtn.addEventListener("click", function(){
    exitPopUp()
})

// Managing pop ups
function openPopUp() {
    if (isPageVisible(mainPage)) {
        mainPage.style.height = "0"
        darkenLayerEl.style.display = "block"
        popupManagementEl.style.display = "block"
    }
}

function closePopUpDisplay() {
    darkenLayerEl.style.display = "none"
    popupManagementEl.style.display = "none"
    mainPage.style.height = "100vh"
}

function exitPopUp() {
    console.log("Exit button clicked")
    closePopUpDisplay()
    addWorkoutPopUpEl.style.display = "none"
    defaultSetRowInput()
}

function defaultSetRowInput() {
    allSetsRow.innerHTML = `
            <div id="add-sets-row">
                <div class="add-sets-input">
                    <p>1</p>
                    <input type="number" class="weight-input-class" id="weight-input" required> <!-- make so that weight follows a specific format of weight + kgs -->
                    <input type="number" class="reps-input-class" id="reps-input" min=0 max=99 required>
                </div>
            </div>
`
}

function isPageVisible(page) {
    return window.getComputedStyle(page).display === 'block'
}


// Adding new sets 
function addNewSetRowInput() {   // For the add new workouts popup
    const allSetsInput = document.querySelectorAll(".add-sets-input")

    if (allSetsInput.length < 5) {
        const lastSetRow = allSetsInput[allSetsInput.length - 1]
        const newSetRow = lastSetRow.cloneNode(true)
        
        // Get the  last set count
        let lastSetCount = Number(lastSetRow.querySelector('p').textContent)
        
        // Increment and update the set number
        const setNumber = newSetRow.querySelector('p')
        setNumber.textContent = lastSetCount + 1

        // Reset input values
        newSetRow.querySelectorAll('input').forEach(input => {
            input.value = ''   // Reset input value to empty string
        })

        // Append the new set row
        allSetsRow.appendChild(newSetRow)
    } else {
        newWorkoutWarningAlert("You can only add up to 5 sets.")
    }
}

addSetsBtn.addEventListener("click", function(event){
    console.log("Add sets button clicked")
    
    event.preventDefault()   // Prevent default form submission behavior
    addNewSetRowInput()
})

function newWorkoutWarningAlert(string) {
    const newWorkoutWarningTextEl = document.getElementById("new-workout-warning-text")
    newWorkoutWarningTextEl.textContent = string
    sleep(2000).then(() => { 
        newWorkoutWarningTextEl.textContent = ""
    })
}

function editSetRowInput() {   // For the edit workout popup 
    const editSetsRowEl = document.getElementById("edit-sets-row")
    const allSetsInput = document.querySelectorAll(".edit-sets-input")

    if (allSetsInput.length < 5) {
        const lastSetRow = allSetsInput[allSetsInput.length - 1]
        const newSetRow = lastSetRow.cloneNode(true)
        
        // Get the  last set count
        let lastSetCount = Number(lastSetRow.querySelector('p').textContent)
        
        // Increment and update the set number
        const setNumber = newSetRow.querySelector('p')
        setNumber.textContent = lastSetCount + 1

        // Reset input values
        newSetRow.querySelectorAll('input').forEach(input => {
            input.value = ''   // Reset input value to empty string
        })

        editSetsRowEl.appendChild(newSetRow)
    } else {
        editWorkoutWarningAlert("You can only add up to 5 sets.")
    }
}


// Creating new workouts
document.getElementById("new-workout-form").addEventListener("submit", function submitForm(event) {
    console.log("Submit form button pressed")
    
    event.preventDefault()

    let workoutNameVal = document.getElementById("workout-name-input").value
    let workoutDesctiptionVal = document.getElementById("workout-description-input").value
    const allSetsInput = document.querySelectorAll(".add-sets-input")
    
    let allSets = []

    allSetsInput.forEach(setRow => {
        let weightInput = setRow.querySelector('.weight-input-class')
        let repsInput = setRow.querySelector('.reps-input-class')

        let weightValue = weightInput.value.trim()
        let repsValue = repsInput.value.trim()

        if (weightValue !== '' && repsValue !== '') {
            allSets.push([weightValue, repsValue])
        }
    })

    saveFormToDatabase(workoutNameVal, workoutDesctiptionVal, allSets)

    exitPopUp()
    
    // Clearing the input field 
    document.getElementById("workout-name-input").value = ""
    document.getElementById("workout-description-input").value = ""
})

function saveFormToDatabase(name, description, sets) {
    let values = {
        name: name,
        description: description,
        sets: sets,
    }
    push(userDB, values)
}

function renderWorkoutCard(id, entries) {

    let description = entries["description"]
    let name = entries["name"]
    let sets = entries["sets"]

    let newSets = ""
    let currentNumber = 1
    for (let i = 0; i < sets.length; i++) {
        newSets += `
            <div class="set-groups">
                <div class="label-value-container">
                    <p class="label">Set</p>
                    <p class="set-value">${currentNumber}</p> <!-- set value won't change -->
                </div>
                <div class="label-value-container">
                    <p class="label">Weight</p>
                    <p class="weight-value">${sets[i][0]} kg</p>
                </div>
                <div class="label-value-container">
                    <p class="label">Reps</p>
                    <p class="reps-value">${sets[i][1]}</p>
                </div>
            </div>
        `
        currentNumber += 1
    }
    let newCard = `
            <div class="workout-card" id="${id}">
            <img src="./assets/more.png" class="edit-workout-btn" id="${id}&edit-btn"alt="Edit workout">
            <h3 class="workout-name">${name}</h3>
            <h4 class="workout-description">${description}</h4>
            <div id="workout-set-groups"  id="${id}&set-groups">
                ${newSets}
            </div>
            <button class="complete-workout-btn" id="${id}&btn">Complete workout</button>
        </div>
    `
    workoutCardGalleryEl.innerHTML += newCard
}

function clearWorkoutCards() {
    workoutCardGalleryEl.innerHTML = ""
}


// Completing and logging workouts
function completeWorkouts() {
    const allCompleteWorkoutBtns = document.querySelectorAll(".complete-workout-btn")

    allCompleteWorkoutBtns.forEach((button) => {
        const buttonID = button.getAttribute("id")
        const buttonIDEl = document.getElementById(buttonID)

        buttonIDEl.addEventListener("click", function() {
            console.log("Complete workout button is clicked")
            
            // Change styling of the button when it is clicked
            buttonIDEl.style.cssText = "background-color: hsl(240, 4%, 95%); color: hsl(255, 45%, 48%); border: 3px solid hsl(255, 65%, 75%);"
            buttonIDEl.textContent = "Completed"
            
            // Get the ID associated with the button that has been clicked
            const workoutCardID = buttonID.substring(0, buttonID.indexOf("&"))
            
            return onValue(userDB, (snapshot) => {
                if (snapshot.exists()) {
                    const workoutCards = snapshot.val()
                    const workoutCardsEntries = Object.entries(workoutCards)
    
                    // Find the workoutcard from the database whose ID matches the ID of the workout card that has been opened
                    for (let i = 0; i < workoutCardsEntries.length; i++) {
                        if (workoutCardsEntries[i][0] === workoutCardID) {
                            const workoutCardProperties = workoutCardsEntries[i][1]
                            logSession(workoutCardProperties)
                        }
                    }
                }
            }, {
                onlyOnce: true   // !! Important to prevent duplicates
            })
        })
    })
}

function logSession(entries) {

    let name = entries["name"]
    let sets = entries["sets"]

    const currentDate = new Date()
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    
    const dateSession = `${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()} ${formatAMPM(new Date)}`
    
    let values = {
        name: name,
        date: dateSession,
        sets: sets,
    }
    push(userLoggedSessionsDB, values)

}

function renderLoggedSessions(entries) {
    let name = entries["name"]
    let dateSession = entries["date"]
    let sets = entries["sets"]

    let logSets = ""
    let currentNumber = 1
    for (let i = 0; i < sets.length; i++) {
        logSets += `
            <ul>
                <li><span id="bolden">${currentNumber}</span> ${sets[i][0]} kg x ${sets[i][1]} reps</li>
            </ul>
        `
        currentNumber += 1
    }

    const newSession = `
        <div class="session-card">
            <div class="logged-name">${name}</div>
            <div class="logged-date">${dateSession}</div>
            <div class="logged-sets">
                ${logSets}
            </div>
        </div>
    `
    sessionGalleryEl.innerHTML += newSession  
}

function clearLoggedSessions() {
    sessionGalleryEl.innerHTML = ""
}


// Editing workouts
function editWorkouts() {
    
    const allEditWorkoutBtns = document.querySelectorAll(".edit-workout-btn")

    allEditWorkoutBtns.forEach((button) => {
        const buttonID = button.getAttribute("id")
        const buttonIDEl = document.getElementById(buttonID)

        buttonIDEl.addEventListener("click", function() {
            console.log("Edit button is clicked")
            
            openPopUp()
            editWorkoutPopUpEl.style.display = "block"

            // Closing the pop up when the exit button has been clicked
            const exitUpdateBtn = document.getElementById("exit-save")
            exitUpdateBtn.addEventListener("click", function() {
                exitPopUp()
                editWorkoutPopUpEl.style.display = "none"
            })
            
            // Get the ID associated with the button that has been clicked
            const workoutCardID = buttonID.substring(0, buttonID.indexOf("&"))
            
            updateNewForm(workoutCardID)

            deleteForm(workoutCardID)

            // Adding more sets
            const editSetsBtn = document.getElementById("edit-a-set-btn")
            editSetsBtn.addEventListener("click", function(event){
                event.preventDefault()   // Prevent default form submission behavior
                console.log("Add sets button clicked")
                editSetRowInput()
            })

            return onValue(userDB, (snapshot) => {
                if (snapshot.exists()) {
                    const workoutCards = snapshot.val()
                    const workoutCardsEntries = Object.entries(workoutCards)
    
                    // Find the workoutcard from the database whose ID matches the ID of the workout card that has been opened
                    for (let i = 0; i < workoutCardsEntries.length; i++) {
                        if (workoutCardsEntries[i][0] === workoutCardID) {
                            const workoutCardProperties = workoutCardsEntries[i][1]
                            showOldProperties(workoutCardProperties)
                        }
                    }
                } else {
                    clearWorkoutCards()
                }
            }, {
                onlyOnce: true
            })
        })
    })
}

function showOldProperties(entries) {
    let description = entries["description"]
    let name = entries["name"]
    let sets = entries["sets"]

    let editSetsRow = document.getElementById("edit-sets-row")

    let editRow = ""
    let currentNumber = 1
    for (let i = 0; i < sets.length; i++) {
        editRow += `
            <div class="edit-sets-input">
                <p>${currentNumber}</p>
                <input type="number" id="edit-weight-input" class="edit-weight-input" id="weight-input" placeholder="${sets[i][0]}" required>
                <input type="number" id="edit-reps-input" class="edit-reps-input" id="reps-input" placeholder="${sets[i][1]}"min=0 max=99 required>
            </div>
        `
        currentNumber += 1
    }

    editNameInputEl.value = name
    editDescriptionInputEl.value = description
    editSetsRow.innerHTML = editRow
    
}

function updateNewForm(id) {
    console.log("Update form is opened")

    const updateWorkoutBtn = document.getElementById("update-workout-btn")
    
    updateWorkoutBtn.addEventListener("click", function() {

        const allSetsInput = document.querySelectorAll(".edit-sets-input")
        let allSets = []

        allSetsInput.forEach(setRow => {
        let weightInput = setRow.querySelector('.edit-weight-input')
        let repsInput = setRow.querySelector('.edit-reps-input')
        
        let weightValue = weightInput.value.trim()
        let repsValue = repsInput.value.trim()

        if (weightValue !== '' && repsValue !== '') {
            allSets.push([weightValue, repsValue])
        }
        })

        // Check that the sets have values, if there are no values in a set then prompt a warning message
        // - If there are values in the set then update the form
        // - Entire program will stop working efficiently if there are no contents inside a set
        if (allSets.length > 0) {
            
            const updates = {}
            let values = {
            name: editNameInputEl.value,
            description: editDescriptionInputEl.value,
            sets: allSets,
            }
            updates[id] = values
            
            // Exiting the screen
            exitPopUp()
            editWorkoutPopUpEl.style.display = "none"

            // Updating the values to firebase 
            return update(userDB, updates)

        } else {
            editWorkoutWarningAlert("You must fill out all sets.")
        }

    })
}

function editWorkoutWarningAlert(string) {
    const editWorkoutWarningTextEl = document.getElementById("edit-workout-warning-text")
    editWorkoutWarningTextEl.textContent = string
    sleep(2000).then(() => { 
        editWorkoutWarningTextEl.textContent = ""
    })
    return
}

// Deleting workouts
function deleteForm(id) {
    const deleteBtn = document.getElementById("delete-btn")
    deleteBtn.addEventListener("click", function() {
        console.log("Delete button clicked")

        let exactLocationOfItem = ref(database, `/${nameID}/${id}`)
        remove(exactLocationOfItem)

        exitPopUp()
        editWorkoutPopUpEl.style.display = "none"
    })
}


// Retrieving values from the database
onValue(userDB, function(snapshot) {
    if (snapshot.exists()) {
        clearWorkoutCards()

        let eachCard = Object.keys(snapshot.val())
        for (let i = 0; i < eachCard.length; i++) {
            let workoutCardID = Object.entries(snapshot.val())[i][0]
            let workoutCardProperties = Object.entries(snapshot.val())[i][1]
            renderWorkoutCard(workoutCardID, workoutCardProperties)
        }
        completeWorkouts() 

        editWorkouts()
    } else {
        clearWorkoutCards()
    }
   
})

onValue(userLoggedSessionsDB, function(snapshot) {
    if(snapshot.exists()) {
        clearLoggedSessions()
        
        let eachCard = Object.keys(snapshot.val())
        for (let i = 0; i < eachCard.length; i++) {
            let loggedSessionsProperties = Object.entries(snapshot.val())[i][1]
            renderLoggedSessions(loggedSessionsProperties)
        }
    } else {
        sessionGalleryEl.innerHTML = ` 
        <div class="session-card">
            <div class="logged-name">
                No logged sessions yet...
            </div>
        </div>`
    }
})