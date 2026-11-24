# Training Center · viste analitiche D1

Database previsto: `storico_garmin` (binding Worker: `DB`).

## Regole di sicurezza

- Le tabelle originali `garmin_records`, `daily_records`, `activities` e `activity_details` restano l'archivio ufficiale.
- Le viste sono livelli virtuali di lettura: non copiano né riscrivono i JSON.
- Non eseguire `DROP TABLE`, `DELETE`, `UPDATE` o operazioni di pulizia per installare queste viste.
- Il file SQL non viene applicato automaticamente dal deploy del Worker.

## Sequenza consigliata

1. Pubblicare il Worker dal branch `main`.
2. Aprire la dashboard Training Center, inserire il `SYNC_BEARER_TOKEN` e usare **Verifica funzioni JSON D1**.
3. Verificare che `json_valid`, `json_extract`, `json_tree` e `json_each` siano disponibili.
4. Usare **Analizza tutti i campi** per raccogliere i percorsi JSON reali.
5. Solo dopo questi controlli, eseguire `001_analytics_base_views.sql` una sola volta nella console SQL D1 del database `storico_garmin`.

## Verifiche dopo l'installazione

Eseguire queste query nella console D1:

```sql
SELECT COUNT(*) AS activities FROM vw_activities;
SELECT COUNT(*) AS daily_records FROM vw_daily_records;
SELECT COUNT(*) AS garmin_records FROM vw_garmin_records;
SELECT COUNT(*) AS activity_details FROM vw_activity_details;

SELECT source_table, dataset, json_path, json_type,
       occurrences, records_with_field, example
FROM vw_json_field_catalog
ORDER BY dataset, json_path
LIMIT 200;

SELECT dataset, record_date, json_path, json_type, text_value, numeric_value
FROM vw_json_scalar_fields
WHERE dataset = 'body_battery'
ORDER BY record_date DESC, json_path
LIMIT 100;
```

I nomi dei dataset nella query di esempio sono filtri dimostrativi: usare quelli effettivamente restituiti dalla mappa campi.

## Significato delle viste

- `vw_activities`: attività con distanza in km, durata in minuti e passo in secondi/km.
- `vw_daily_records`: accesso uniforme ai payload giornalieri originali.
- `vw_garmin_records`: accesso uniforme ai record Garmin originali.
- `vw_activity_details`: attività collegate ai dettagli estesi.
- `vw_json_scalar_fields`: valori scalari dei JSON con percorso completo, dataset e data.
- `vw_json_field_catalog`: frequenza dei campi e un esempio per ciascun percorso.

Le viste JSON sono generiche. Le viste specifiche per sonno, frequenza cardiaca, HRV, Body Battery, peso, passi e VO2 max vanno definite soltanto dopo aver letto i percorsi reali restituiti dalla mappa.
