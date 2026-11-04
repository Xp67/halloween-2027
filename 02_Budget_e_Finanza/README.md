# 02 · Budget e Finanza

L'obiettivo è il guadagno, quindi qui si decide se la festa sta in piedi. Le voci di costo sono in [budget.csv](budget.csv), che si apre direttamente con Excel.

## Il conto di base

```
Ricavi   = biglietti venduti × prezzo medio netto  +  consumazioni bar  +  sponsor
Costi    = costi fissi  +  costi variabili per persona × persone
Utile    = Ricavi − Costi − tasse
```

**Punto di pareggio** (quante persone servono per non perderci):

```
Persone di pareggio = (Costi fissi − Sponsor) / (Ricavo netto per persona − Costo variabile per persona)
```

Dove *ricavo netto per persona* = prezzo medio del biglietto senza IVA, imposte e commissioni della piattaforma, più la spesa media al bar meno il costo di quello che si beve.

La commissione del gateway ha anche una parte fissa per transazione: incide molto di più su un biglietto singolo da 10 € che su un ordine da 4 biglietti.

## Ipotesi da fissare

| Ipotesi | Valore |
|---|---|
| Capienza massima | |
| Presenze previste (scenario prudente) | |
| Presenze previste (scenario realistico) | |
| Prezzo medio del biglietto | |
| Spesa media al bar per persona | |
| Margine sul bar (%) | |
| Commissione gateway di pagamento (% + fisso per transazione) | |
| Entrate da sponsor | |

## Tasse da considerare

Da confermare con un commercialista prima di fissare i prezzi:

- **IVA** sui biglietti e sulle consumazioni.
- **Imposta sugli intrattenimenti (ISI)**: si applica alle serate danzanti con biglietto.
- **SIAE**: diritti d'autore sulla musica, in genere in percentuale sugli incassi.
- Imposte sul reddito, in base alla forma fiscale scelta (vedi [04](../04_Legale_e_Permessi/README.md)).

I prezzi al pubblico vanno ragionati **al lordo** di queste voci: su un biglietto da 20 € ne resta in tasca molto meno.

## Scenari

| Scenario | Presenze | Ricavi | Costi | Utile |
|---|---|---|---|---|
| Pessimista | | | | |
| Realistico | | | | |
| Ottimista | | | | |

## Cassa e anticipi

- Chi anticipa le spese (caparra location, artisti, grafiche) e quanto.
- Conto dedicato all'evento, separato da quelli personali.
- Come si dividono gli utili tra gli organizzatori: da mettere per iscritto **prima** della festa.

## Checklist

- [ ] Compilato `budget.csv` con i preventivi veri
- [ ] Calcolato il punto di pareggio
- [ ] Verificate le tasse con il commercialista
- [ ] Fissati i prezzi
- [ ] Aperto un conto dedicato
- [ ] Accordo scritto tra organizzatori su anticipi e utili
