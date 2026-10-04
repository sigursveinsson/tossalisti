-- Vörumerkja-mælaborð (lota 9, 4. okt 2026). ÞEGAR Í LOFTINU (migrations brand_dashboard_v1 + brand_dashboard_v1_tempfix).
-- Ekki keyra aftur nema til að endurbyggja. Heimild fyrir það sem er í gagnagrunninum.

alter table public.purchase_items
  add column if not exists reward_product_id uuid references public.reward_products(id) on delete set null;
create index if not exists purchase_items_reward_product_idx on public.purchase_items(reward_product_id) where reward_product_id is not null;

create or replace function public.norm_match(t text) returns text
language sql immutable as $$
  select regexp_replace(
    translate(replace(replace(replace(lower(coalesce(t,'')),'þ','th'),'æ','ae'),'ð','d'),
      'áàâäéèêíìîóòôöúùûý', 'aaaaeeeiiioooouuuy'),
    '[^a-z0-9]', '', 'g')
$$;

create or replace function public.store_chain(s text) returns text
language sql immutable as $$
  select case
    when s is null or btrim(s) = '' then 'Óþekkt'
    when lower(s) ~ 'kr[oó]nan' then 'Krónan'
    when lower(s) ~ 'b[oó]nus' then 'Bónus'
    when lower(s) ~ 'nett[oó]' then 'Nettó'
    when lower(s) ~ 'hagkaup' then 'Hagkaup'
    when lower(s) ~ 'costco' then 'Costco'
    when lower(s) ~ 'fjar[dð]arkaup' then 'Fjarðarkaup'
    when lower(s) ~ 'kj[oö]rb[uú][dð]' then 'Kjörbúðin'
    when lower(s) ~ 'kramb[uú][dð]' then 'Krambúðin'
    when lower(s) ~ 'iceland' then 'Iceland'
    when lower(s) ~ '10-11|10 11' then '10-11'
    when lower(s) ~ 'extra' then 'Extra'
    when lower(s) ~ 'heimkaup' then 'Heimkaup'
    else 'Aðrar verslanir'
  end
$$;

-- brand_dashboard(p_brand_id, p_days=90, p_min=5) → jsonb
-- Aðeins stjórnandi (sigursveinsson@gmail.com). k-nafnleysi: <p_min kaupendur → insufficient / falið / sameinað.
-- Pörun kvittanalínu: purchase_items.reward_product_id (AI) EÐA öll leitarorð vörunnar í norm_match(heiti).
-- Skilar: totals (lines, units, revenue, receipts, buyers, repeat_buyers, repeat_rate, new_buyers, new_rate, cashback),
--         by_week, by_chain, by_product (repeat_rate), basket (keypt með, share af kvittunum).
-- Sjá fulla skilgreiningu í gagnagrunninum: select pg_get_functiondef('public.brand_dashboard'::regproc);
