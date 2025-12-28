// Tournament page functionality
export async function tournamentListener(): Promise<void> {
    console.log('Tournament page loaded');

    const TOURNAMENT_API = `${window.location.protocol}//${window.location.host}/api/tournament`;

    // Helper function to show notifications
    function showNotification(message: string, variant: 'success' | 'error' | 'warning' | 'info'): void {
        const notificationArea = document.getElementById('tournament-notifications');
        if (notificationArea) {
            notificationArea.innerHTML = '';
            const alert = document.createElement('app-alert');
            alert.setAttribute('variant', variant);
            alert.setAttribute('dismissible', '');
            alert.textContent = message;
            notificationArea.appendChild(alert);
        }
    }

    // Load tournaments
    async function loadTournaments() {
        try {
            const response = await fetch(`${TOURNAMENT_API}/tournaments`);
            const data = await response.json();
            displayTournaments(data.tournaments || []);
        } catch (error) {
            console.error('Failed to load tournaments:', error);
        }
    }

    // Display tournaments in the list
    function displayTournaments(tournaments: any[]) {
        const list = document.getElementById('tournament-list');
        if (!list) return;

        if (tournaments.length === 0) {
            list.innerHTML = '<p class="mono-text">No tournaments available. Create one!</p>';
            return;
        }

        list.innerHTML = tournaments.map(t => `
            <div class="border-2 border-black p-4 mb-4">
                <h3 class="font-bold text-lg">${t.name}</h3>
                <p class="mono-text">Status: ${t.status}</p>
                <p class="mono-text">Players: ${t.max_players} max</p>
                <button 
                    class="bg-black text-white px-4 py-2 mt-2 hover:bg-gray-800"
                    onclick="viewTournament(${t.id})">
                    View Details
                </button>
            </div>
        `).join('');
    }

    // Create tournament form submission
    const createForm = document.getElementById('create-tournament-form') as HTMLFormElement;
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(createForm);
            const name = formData.get('name') as string;
            const maxPlayers = parseInt(formData.get('max_players') as string);

            try {
                const response = await fetch(`${TOURNAMENT_API}/tournaments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, max_players: maxPlayers })
                });

                if (response.ok) {
                    showNotification('Tournament created successfully!', 'success');
                    createForm.reset();
                    await loadTournaments();
                } else {
                    showNotification('Failed to create tournament', 'error');
                }
            } catch (error) {
                console.error('Error creating tournament:', error);
                showNotification('Error creating tournament', 'error');
            }
        });
    }

    // Make viewTournament available globally
    (window as any).viewTournament = async (id: number) => {
        try {
            const [tournament, registrations, brackets] = await Promise.all([
                fetch(`${TOURNAMENT_API}/tournaments/${id}`).then(r => r.json()),
                fetch(`${TOURNAMENT_API}/tournaments/${id}/registrations`).then(r => r.json()),
                fetch(`${TOURNAMENT_API}/tournaments/${id}/brackets`).then(r => r.json())
            ]);

            displayTournamentDetails(tournament, registrations, brackets);
        } catch (error) {
            console.error('Error loading tournament details:', error);
        }
    };

    function displayTournamentDetails(tournament: any, registrations: any, brackets: any) {
        const details = document.getElementById('tournament-details');
        if (!details) return;

        details.innerHTML = `
            <div class="border-2 border-black p-6">
                <h2 class="text-2xl font-bold mb-4">${tournament.name}</h2>
                <p class="mono-text">Status: ${tournament.status}</p>
                <p class="mono-text">Max Players: ${tournament.max_players}</p>
                
                <div class="mt-6">
                    <h3 class="font-bold text-lg mb-2">Registered Players (${registrations.registrations?.length || 0})</h3>
                    ${registrations.registrations?.map((r: any) => 
                        `<p class="mono-text">- ${r.player_alias}</p>`
                    ).join('') || '<p class="mono-text">No players registered</p>'}
                </div>

                ${tournament.status === 'registration' ? `
                    <div class="mt-6">
                        <input 
                            type="text" 
                            id="player-name" 
                            placeholder="Your name"
                            class="border-2 border-black p-2 mr-2">
                        <button 
                            class="bg-black text-white px-4 py-2 hover:bg-gray-800"
                            onclick="registerPlayer(${tournament.id})">
                            Register
                        </button>
                        ${registrations.registrations?.length >= 2 ? `
                            <button 
                                class="bg-black text-white px-4 py-2 ml-2 hover:bg-gray-800 uppercase font-bold border-2 border-black"
                                onclick="startTournament(${tournament.id})">
                                Start Tournament
                            </button>
                        ` : ''}
                    </div>
                ` : ''}

                ${brackets.brackets?.length > 0 ? `
                    <div class="mt-6">
                        <h3 class="font-bold text-lg mb-2">Tournament Brackets</h3>
                        ${brackets.brackets.filter((b: any) => b.player2_alias !== null).map((b: any) => `
                            <div class="border-2 border-black p-4 mb-3 ${b.winner_alias ? 'bg-gray-100' : 'bg-white'}">
                                <p class="font-bold text-sm mb-2 uppercase">Round ${b.round} - Match ${b.position + 1}</p>
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <p class="text-lg font-bold uppercase ${b.winner_alias === b.player1_alias ? 'text-red-600' : ''}">
                                            ${b.player1_alias}
                                        </p>
                                        <p class="text-sm text-gray-600 my-2 font-bold">VS</p>
                                        <p class="text-lg font-bold uppercase ${b.winner_alias === b.player2_alias ? 'text-blue-600' : ''}">
                                            ${b.player2_alias}
                                        </p>
                                    </div>
                                    <div class="flex-1 text-right">
                                        ${b.winner_alias ? `
                                            <p class="font-bold uppercase">Winner:</p>
                                            <p class="text-xl font-bold ${b.winner_alias === b.player1_alias ? 'text-red-600' : 'text-blue-600'}">${b.winner_alias}</p>
                                            <p class="text-xs text-gray-500 uppercase mono-text">Match completed</p>
                                        ` : `
                                            <button 
                                                class="bg-black text-white px-6 py-3 hover:bg-gray-800 font-bold uppercase border-2 border-black"
                                                onclick="prepareMatch(${tournament.id}, '${b.player1_alias}', '${b.player2_alias}', ${b.round}, ${b.position})">
                                                PLAY MATCH
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <button 
                    class="bg-gray-600 text-white px-4 py-2 mt-4 hover:bg-gray-700"
                    onclick="backToList()">
                    Back to List
                </button>
            </div>
        `;
    }

    (window as any).registerPlayer = async (tournamentId: number) => {
        const input = document.getElementById('player-name') as HTMLInputElement;
        const playerName = input?.value.trim();

        if (!playerName) {
            showNotification('Please enter your name', 'warning');
            return;
        }

        try {
            const response = await fetch(`${TOURNAMENT_API}/tournaments/${tournamentId}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_alias: playerName })
            });

            if (response.ok) {
                showNotification('Player registered successfully!', 'success');
                (window as any).viewTournament(tournamentId);
            } else {
                const error = await response.json();
                showNotification(error.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Error registering:', error);
            showNotification('Error registering for tournament', 'error');
        }
    };

    (window as any).startTournament = async (tournamentId: number) => {
        try {
            const response = await fetch(`${TOURNAMENT_API}/tournaments/${tournamentId}/start`, {
                method: 'POST'
            });

            if (response.ok) {
                showNotification('Tournament started! Brackets generated.', 'success');
                (window as any).viewTournament(tournamentId);
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to start tournament', 'error');
            }
        } catch (error) {
            console.error('Error starting tournament:', error);
            showNotification('Error starting tournament', 'error');
        }
    };

    (window as any).backToList = () => {
        const details = document.getElementById('tournament-details');
        if (details) details.innerHTML = '';
        loadTournaments();
    };

    // Match preparation - both players confirm
    (window as any).prepareMatch = (tournamentId: number, player1: string, player2: string, round: number, position: number) => {
        const details = document.getElementById('tournament-details');
        if (!details) return;

        details.innerHTML = `
            <div class="border-2 border-black p-8 max-w-4xl mx-auto">
                <h2 class="text-3xl font-bold mb-6 text-center">MATCH PREPARATION</h2>
                <p class="text-xl text-center mb-8">Round ${round} - Match ${position + 1}</p>
                
                <div class="grid grid-cols-2 gap-8 mb-8">
                    <!-- Player 1 Confirmation -->
                    <div class="border-2 border-blue-600 p-6 text-center">
                        <h3 class="text-2xl font-bold mb-4">${player1}</h3>
                        <p class="mono-text mb-4">Controls: W (UP) / S (DOWN)</p>
                        <button 
                            id="player1-ready"
                            class="w-full bg-blue-600 text-white py-4 text-xl hover:bg-blue-700 disabled:opacity-50"
                            onclick="confirmPlayer(1, '${player1}')">
                            I'M READY!
                        </button>
                        <p id="player1-status" class="mt-4 text-sm text-gray-500">Waiting for confirmation...</p>
                    </div>

                    <!-- Player 2 Confirmation -->
                    <div class="border-2 border-red-600 p-6 text-center">
                        <h3 class="text-2xl font-bold mb-4">${player2}</h3>
                        <p class="mono-text mb-4">Controls: ↑ (UP) / ↓ (DOWN)</p>
                        <button 
                            id="player2-ready"
                            class="w-full bg-red-600 text-white py-4 text-xl hover:bg-red-700 disabled:opacity-50"
                            onclick="confirmPlayer(2, '${player2}')">
                            I'M READY!
                        </button>
                        <p id="player2-status" class="mt-4 text-sm text-gray-500">Waiting for confirmation...</p>
                    </div>
                </div>

                <div id="match-start-area" class="text-center">
                    <p class="text-gray-500 text-lg">Both players must confirm to start the match</p>
                </div>

                <button 
                    class="bg-gray-600 text-white px-4 py-2 mt-6 hover:bg-gray-700"
                    onclick="viewTournament(${tournamentId})">
                    Cancel
                </button>
            </div>
        `;

        // Store match data for later
        (window as any).currentMatch = {
            tournamentId,
            player1,
            player2,
            player1Ready: false,
            player2Ready: false
        };
    };

    // Player confirmation
    (window as any).confirmPlayer = (playerNum: number, playerName: string) => {
        const match = (window as any).currentMatch;
        if (!match) return;

        if (playerNum === 1) {
            match.player1Ready = true;
            const btn = document.getElementById('player1-ready') as HTMLButtonElement;
            const status = document.getElementById('player1-status');
            if (btn) {
                btn.disabled = true;
                btn.textContent = '✓ READY!';
                btn.classList.add('bg-black');
                btn.classList.remove('bg-blue-600');
            }
            if (status) status.textContent = '✓ Ready to play!';
        } else {
            match.player2Ready = true;
            const btn = document.getElementById('player2-ready') as HTMLButtonElement;
            const status = document.getElementById('player2-status');
            if (btn) {
                btn.disabled = true;
                btn.textContent = '✓ READY!';
                btn.classList.add('bg-black');
                btn.classList.remove('bg-red-600');
            }
            if (status) status.textContent = '✓ Ready to play!';
        }

        // Check if both ready
        if (match.player1Ready && match.player2Ready) {
            const startArea = document.getElementById('match-start-area');
            if (startArea) {
                startArea.innerHTML = `
                    <div class="bg-white border-4 border-black p-6">
                        <p class="text-2xl font-bold uppercase mb-4 font-mono">BOTH PLAYERS READY!</p>
                        <button 
                            class="bg-black text-white px-8 py-4 text-xl hover:bg-gray-800 font-bold uppercase border-2 border-black"
                            onclick="startMatch()">
                            START MATCH NOW!
                        </button>
                    </div>
                `;
            }
        }
    };

    // Start the actual game
    (window as any).startMatch = () => {
        const match = (window as any).currentMatch;
        if (!match) return;

        // Store tournament match data in sessionStorage
        sessionStorage.setItem('tournamentMatch', JSON.stringify({
            tournamentId: match.tournamentId,
            player1: match.player1,
            player2: match.player2
        }));

        // Navigate to game page
        window.location.href = '/game';
    };

    // Initial load
    loadTournaments();
}
