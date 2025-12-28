// Leaderboard page functionality
export async function leaderboardListener() {
    console.log('Leaderboard page loaded');
    const TOURNAMENT_API = `${window.location.protocol}//${window.location.host}/api/tournament`;
    // Load completed and ongoing tournaments
    async function loadLeaderboard() {
        try {
            const response = await fetch(`${TOURNAMENT_API}/tournaments`);
            const data = await response.json();
            const completedTournaments = data.tournaments.filter((t) => t.status === 'completed');
            const ongoingTournaments = data.tournaments.filter((t) => t.status === 'in_progress');
            displayCompletedTournaments(completedTournaments);
            displayOngoingTournaments(ongoingTournaments);
        }
        catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    }
    async function displayCompletedTournaments(tournaments) {
        const container = document.getElementById('completed-tournaments');
        if (!container)
            return;
        if (tournaments.length === 0) {
            container.innerHTML = '<p class="mono-text text-gray-500">No completed tournaments yet</p>';
            return;
        }
        let html = '';
        for (const tournament of tournaments) {
            try {
                // Get tournament brackets to calculate standings
                const bracketsResponse = await fetch(`${TOURNAMENT_API}/tournaments/${tournament.id}/brackets`);
                const bracketsData = await bracketsResponse.json();
                // Calculate player standings
                const playerStats = calculatePlayerStats(bracketsData.brackets);
                const sortedPlayers = Object.entries(playerStats)
                    .sort((a, b) => {
                    if (b[1].wins !== a[1].wins)
                        return b[1].wins - a[1].wins;
                    return b[1].score - a[1].score;
                });
                html += `
                    <div class="border-4 border-black p-6 mb-6 bg-white">
                        <h3 class="text-2xl font-bold mb-4 bg-black text-white p-3">
                            ${tournament.name}
                        </h3>
                        <p class="mono-text text-sm mb-4 text-gray-600">
                            Completed: ${new Date(tournament.completed_at).toLocaleDateString()}
                        </p>
                        
                        <div class="border-2 border-black">
                            <div class="grid grid-cols-4 bg-black text-white font-bold p-3">
                                <div>RANK</div>
                                <div>PLAYER</div>
                                <div>WINS</div>
                                <div>TOTAL SCORE</div>
                            </div>
                            ${sortedPlayers.map(([player, stats], index) => `
                                <div class="grid grid-cols-4 p-3 border-t-2 border-black bg-white">
                                    <div class="font-bold ${index === 0 ? 'text-xl' : ''}">${index === 0 ? '#1' : '#' + (index + 1)}</div>
                                    <div class="font-bold ${index === 0 ? 'text-lg' : ''}">${player}</div>
                                    <div>${stats.wins}</div>
                                    <div>${stats.score}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            catch (error) {
                console.error(`Failed to load tournament ${tournament.id}:`, error);
            }
        }
        container.innerHTML = html;
    }
    async function displayOngoingTournaments(tournaments) {
        const container = document.getElementById('ongoing-tournaments');
        if (!container)
            return;
        if (tournaments.length === 0) {
            container.innerHTML = '<p class="mono-text text-gray-500">No ongoing tournaments</p>';
            return;
        }
        let html = '';
        for (const tournament of tournaments) {
            try {
                // Get tournament brackets to calculate current standings
                const bracketsResponse = await fetch(`${TOURNAMENT_API}/tournaments/${tournament.id}/brackets`);
                const bracketsData = await bracketsResponse.json();
                // Calculate player standings
                const playerStats = calculatePlayerStats(bracketsData.brackets);
                const sortedPlayers = Object.entries(playerStats)
                    .sort((a, b) => {
                    if (b[1].wins !== a[1].wins)
                        return b[1].wins - a[1].wins;
                    return b[1].score - a[1].score;
                });
                html += `
                    <div class="border-4 border-black p-6 mb-6 bg-white">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-2xl font-bold bg-black text-white p-3">
                                ${tournament.name}
                            </h3>
                            <span class="bg-black text-white px-4 py-2 font-bold mono-text border-2 border-black">
                                IN PROGRESS
                            </span>
                        </div>
                        <p class="mono-text text-sm mb-4 text-gray-600">
                            Started: ${new Date(tournament.started_at).toLocaleDateString()}
                        </p>
                        
                        <div class="border-2 border-black">
                            <div class="grid grid-cols-4 bg-black text-white font-bold p-3">
                                <div>RANK</div>
                                <div>PLAYER</div>
                                <div>WINS</div>
                                <div>TOTAL SCORE</div>
                            </div>
                            ${sortedPlayers.map(([player, stats], index) => `
                                <div class="grid grid-cols-4 p-3 border-t-2 border-black bg-white">
                                    <div class="font-bold">${index + 1}</div>
                                    <div class="font-bold">${player}</div>
                                    <div>${stats.wins}</div>
                                    <div>${stats.score}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <a href="/tournament" 
                           class="inline-block mt-4 bg-black text-white px-6 py-3 hover:bg-gray-800 font-bold uppercase border-2 border-black font-mono">
                            View Tournament
                        </a>
                    </div>
                `;
            }
            catch (error) {
                console.error(`Failed to load tournament ${tournament.id}:`, error);
            }
        }
        container.innerHTML = html;
    }
    function calculatePlayerStats(brackets) {
        const stats = {};
        brackets.forEach((bracket) => {
            // Initialize players
            if (bracket.player1_alias && !stats[bracket.player1_alias]) {
                stats[bracket.player1_alias] = { wins: 0, losses: 0, score: 0 };
            }
            if (bracket.player2_alias && !stats[bracket.player2_alias]) {
                stats[bracket.player2_alias] = { wins: 0, losses: 0, score: 0 };
            }
            // Count wins/losses if match is completed
            if (bracket.winner_alias) {
                if (bracket.player1_alias === bracket.winner_alias) {
                    stats[bracket.player1_alias].wins++;
                    stats[bracket.player1_alias].score += 10; // Assuming 10 points to win
                    if (bracket.player2_alias) {
                        stats[bracket.player2_alias].losses++;
                    }
                }
                else if (bracket.player2_alias === bracket.winner_alias) {
                    stats[bracket.player2_alias].wins++;
                    stats[bracket.player2_alias].score += 10;
                    stats[bracket.player1_alias].losses++;
                }
            }
        });
        return stats;
    }
    // Initial load
    loadLeaderboard();
}
