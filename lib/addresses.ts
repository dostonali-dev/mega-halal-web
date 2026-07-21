import { supabase } from "@/lib/supabase";

export type Address = {
  id: number;
  address: string | null;
  address_detail: string | null;
  address_image: string | null;
  is_default: boolean;
};

export async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function addAddress(
  userId: string,
  fields: { address?: string | null; address_detail?: string | null; address_image?: string | null },
  makeDefault: boolean
) {
  if (makeDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  }
  const { data, error } = await supabase
    .from("addresses")
    .insert({ user_id: userId, ...fields, is_default: makeDefault })
    .select()
    .single();
  return { data, error };
}

export async function setDefaultAddress(userId: string, addressId: number) {
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId);
  return error;
}

export async function deleteAddress(addressId: number) {
  const { error } = await supabase.from("addresses").delete().eq("id", addressId);
  return error;
}