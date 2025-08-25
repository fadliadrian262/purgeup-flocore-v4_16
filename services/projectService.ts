import { DashboardData, AlertUrgency, AlertCategory, User } from '../types';
import { IconBookCheck, IconMail, IconSheet, IconTriangleAlert, IconCamera } from '../components/icons';


export const getProjectData = async (user: User): Promise<DashboardData> => {
    console.log("Fetching project data from remote for user:", user.name);
    return new Promise((resolve) => {
        setTimeout(() => {
             const rawAlerts = [
                 { id: 1, timestamp: new Date(new Date().setDate(new Date().getDate() - 1)), icon: IconBookCheck, title: "Change Order #CO-07 Approved", message: "Client approved change order for Level 3 interior finishes. Budget updated.", urgency: AlertUrgency.INFO, category: AlertCategory.GENERAL },
                 { id: 2, timestamp: new Date(new Date().setHours(new Date().getHours() - 4)), icon: IconMail, title: "RFI #112 Response Received", message: "Architect responded to RFI regarding HVAC duct placement. See documents.", urgency: AlertUrgency.INFO, category: AlertCategory.GENERAL },
                 { id: 3, timestamp: new Date(new Date().setHours(new Date().getHours() - 1)), icon: IconSheet, title: "Concrete Pour (Lvl 2 Slab) Scheduled", message: "Pour scheduled for tomorrow at 8:00 AM. All pre-pour checks must be completed EOD.", urgency: AlertUrgency.WARNING, category: AlertCategory.LOGISTICS },
                 { id: 4, timestamp: new Date(), icon: IconTriangleAlert, title: "Weekly Safety Audit: Friday 9AM", message: "Lead Safety Officer will be on site for the weekly audit this Friday.", urgency: AlertUrgency.INFO, category: AlertCategory.SAFETY },
                 { id: 5, timestamp: new Date(new Date().setDate(new Date().getDate() - 2)), icon: IconCamera, title: "New Structural Drawings Uploaded", message: "Revision 3 of structural drawings are now available in the document hub.", urgency: AlertUrgency.INFO, category: AlertCategory.GENERAL },
            ];
            
             const sortedAlerts = rawAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            
            const data: DashboardData = {
                user,
                weather: {
                    condition: 'Clear',
                    temp: 24,
                    windSpeed: 10,
                    forecast: 'Clear until 3 PM, then chance of rain.'
                },
                team: {
                    onSite: 34,
                    total: 40,
                    trades: [
                        { name: 'Concrete', count: 8 },
                        { name: 'Steelwork', count: 12 },
                        { name: 'Electrical', count: 6 },
                        { name: 'Plumbing', count: 5 },
                        { name: 'Other', count: 3 }
                    ]
                },
                equipment: [
                    { id: 'crane-01', name: 'Tower Crane 1', status: 'Attention' },
                    { id: 'exc-01', name: 'Excavator A', status: 'Operational' },
                    { id: 'gen-03', name: 'Generator C', status: 'Offline' }
                ],
                progress: {
                    completion: 68,
                    safetyScore: 92
                },
                alerts: sortedAlerts,
                // --- DEVELOPMENT: API Calls Disabled ---
                // isLoading is set to true to trigger the API call from App.tsx.
                briefing: { cards: [], isLoading: true, error: null, lastUpdated: null },
                dailyFocus: { text: "Daily Focus generation is disabled during development.", isLoading: false, error: null },
                priorityTasks: { tasks: [], isLoading: false, error: "Task generation is disabled during development." }
            };

            console.log("Successfully fetched project data.");
            resolve(data);
        }, 1000); // Simulate network delay
    });
};