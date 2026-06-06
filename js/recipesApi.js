import { supabase } from "./supabaseClient.js";
import { STORAGE_BUCKET } from "./config.js";

export async function listRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("fecha_creacion", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getRecipe(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRecipe(recipe) {
  const { data, error } = await supabase
    .from("recipes")
    .insert(recipe)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecipe(id, recipe) {
  const { data, error } = await supabase
    .from("recipes")
    .update(recipe)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPhoto(file) {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
