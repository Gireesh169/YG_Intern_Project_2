import supabaseService from "./supabaseService";

export async function getAnalyticsAll() {
  return await supabaseService.get_analytics_all();
}
