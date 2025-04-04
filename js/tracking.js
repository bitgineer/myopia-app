// Wrap in an IIFE (Immediately Invoked Function Expression) to create a scope
// and expose a public interface via window.myopiaTracker
(function() {
    const STORAGE_KEY = 'myopiaAppProgress';
    let currentSession = null; // Holds data for the session in progress

    // Function to get history from localStorage
    function getHistory() {
        const history = localStorage.getItem(STORAGE_KEY);
        return history ? JSON.parse(history) : [];
    }

    // Function to save history to localStorage
    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    // Function called when a session starts
    function startSession(speed, pattern) { // Added pattern parameter
        // We don't save immediately, wait until stopSession
        currentSession = {
            startTime: Date.now(), // Record start time as timestamp
            speed: speed,
            pattern: pattern, // Store the pattern
            durationMs: 0 // Store duration in milliseconds
        };
        console.log("Session started:", currentSession); // For debugging
    }

    // Function called when a session stops
    function stopSession(durationMs) {
        if (!currentSession) {
            console.warn("stopSession called without an active session.");
            return; // No active session to stop
        }

        // Duration passed from main.js is based on Date.now() difference
        currentSession.durationMs = Math.max(0, Math.round(durationMs)); // Store raw duration in ms, ensure non-negative

        // Only save sessions with a meaningful duration (e.g., > 0 seconds)
        // Only save sessions with a meaningful duration (e.g., > 100ms)
        if (currentSession.durationMs > 100) {
            const history = getHistory();
            history.push(currentSession);
            saveHistory(history);
            console.log("Session stopped and saved:", currentSession); // For debugging
        } else {
             console.log("Session stopped but not saved (duration too short):", currentSession); // For debugging
        }


        currentSession = null; // Clear the current session
    }
    
    // Function to get the duration of the currently running session (if any)
    // Used mainly by the timer display if main.js logic resets its own timers on stop.
    // This function might be less useful now, but keep it for calculating live duration if needed.
    function getCurrentDuration() {
        if (currentSession) {
             return Date.now() - currentSession.startTime; // Returns duration in ms
        }
         return 0; // No active session
    }

    // Function to get the duration of the *last completed* session from history
    function getLastDuration() {
        const history = getHistory();
        if (history.length > 0) {
            // Sort by startTime descending to be sure we get the latest one
             history.sort((a, b) => b.startTime - a.startTime);
             return history[0].durationMs; // Return duration in ms
        }
        return 0; // No history
    }


    // Expose public functions via a global object
    window.myopiaTracker = {
        startSession: startSession,
        stopSession: stopSession,
        getHistory: getHistory,
        getCurrentDuration: getCurrentDuration,
        getLastDuration: getLastDuration // Expose the new helper
    };

})(); // End IIFE