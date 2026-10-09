# Livraison Bistrava — transporteur et page publique

Vérification du 9 octobre 2026. Complète la [comparaison des tarifs](shipping-benchmark-2026-10-09.md).

## Choix du transporteur

**Pošta Slovenije est retenue comme transporteur prévu pour les livraisons nationales.** Le rapport 2024 de l'AKOS, publié en septembre 2025, lui attribue plus de 60 % du volume des colis domestiques (§ 7, figure 26). C'est le dernier rapport annuel de marché retrouvé lors de cette recherche. Ce constat porte sur 2024 et sur ce segment ; il ne démontre pas que chaque concurrent utilise ce transporteur.

Source : [AKOS — état du marché postal en 2024](https://www.akos-rs.si/fileadmin/user_upload/dokumenti/Posta/Novice_2024_in_2025/Letno_porocilo_o_stanju_na_trgu_postnih_storitev_za_leto_2024.pdf).

### Transporteurs des concurrents

| Boutique | Constat dans les informations officielles consultées |
| --- | --- |
| GGV | Les CGV parlent de transporteurs contractuels, sans marque. |
| Vodni-filtri.si | La livraison postale est évoquée, sans opérateur identifié. |
| EKOM | Aucun transporteur nommé dans la page de conditions retrouvée. |
| Tehnofan / filtri-za-vodo.si | Aucun nom dans la page HTML. Le PDF lié est bloqué par une vérification antibot et n'a pas été vérifié. |

Sources : [GGV](https://ggv.si/splosni-pogoji-poslovanja/), [Vodni Filtri](https://vodni-filtri.si/dostava-in-placila/), [EKOM](https://ekom.si/splosni-pogoji-in-piskotki/), [Tehnofan](https://filtri-za-vodo.si/pogoji-poslovanja/).

## Informations de livraison publiées

- Zone : adresses en Slovénie uniquement.
- Prix : données actives de Supabase, identiques à celles du panier et de la commande. Aucun prix ou seuil dupliqué dans la copie statique.
- Préparation et délai de réception distingués du transport : l'indication de 1 à 3 jours ouvrés commence après remise au transporteur. Elle n'est pas une promesse de livraison Bistrava à compter de l'achat. Les fiches produits n'affichent pas encore de délai de réception et les estimations des tarifs sont vides ; la page invite donc à demander la date prévisionnelle pour le produit choisi.
- Suivi : lien vers le service officiel, avec numéro de suivi. Aucune promesse de notifications automatiques ou de suivi dans le compte client.
- Absence : le client suit le lieu et la date figurant sur l'avis du transporteur. Une redirection dépend de la disponibilité du service pour le colis ; aucun choix de consigne n'est annoncé au checkout.
- Colis lourds : coordination du mode de remise et de l'accès si nécessaire. Pas d'installation ni de portage à l'étage inclus par défaut, et aucun supplément de transport ajouté après commande.
- Réclamation : Bistrava reste l'interlocuteur du client. Les photos facilitent le traitement sans constituer une condition supprimant les droits légaux. Aucun délai arbitraire de 24 ou 48 heures pour déclarer un dommage.
- Retours : lien vers la politique existante, sans inventer d'adresse de retour.

Sources opérationnelles : [délais de transport](https://www.posta.si/roki-prenosa), [suivi](https://moja.posta.si/tracking), [modifications de livraison](https://www.posta.si/zasebno/postne-storitve/prejemanje/moja-dostava-moja-izbira), [centre d'aide](https://www.posta.si/zasebno/mojaposta/center-za-pomoc).

Cadre des responsabilités : [guide officiel slovène des boutiques en ligne](https://spot.gov.si/sl/dejavnosti-in-poklici/vodic-za-spletne-trgovine), [informations européennes sur l'expédition et la livraison](https://europa.eu/youreurope/citizens/consumers/shopping/shipping-delivery/index_en.htm).

## Avant de lancer les expéditions

Le contrat de transport, la collecte, les coûts réels et la préparation des commandes restent à finaliser par l'exploitant. La page publique qualifie donc Pošta Slovenije de **transporteur prévu**, sans logo de partenariat ni annonce de contrat signé.

La gamme professionnelle actuelle est [MojPaket](https://www.posta.si/poslovno/logisticne-storitve/paketi/mojpaket), sur contrat. Ses [conditions depuis novembre 2025](https://www.posta.si/Documents/Zakoni%20in%20splo%C5%A1ni%20pogoji/Splosni-pogoji-poslovanja-s-paketi-MojPaket.pdf) doivent servir à choisir les services et vérifier poids, dimensions, emballage et modalités de remise de chaque référence. L'ancienne page Poslovni paket renvoie 404 ; ses anciennes limites ne sont pas utilisées.

Cette publication ne crée pas de compte transporteur, d'intégration d'étiquettes ou d'achat de transport. Les commandes et paiements conservent leur configuration actuelle, désactivée. Une fois le contrat conclu, remplacer la mention de choix prévu et renseigner les délais réellement assurés.

Avant l'ouverture des ventes, compléter aussi l'adresse actuellement manquante dans `/vracila` et préciser que la demande d'une référence de retour n'est pas une autorisation préalable conditionnant les droits du consommateur. Ces points préexistants sont hors du changement de page Livraison.

## Présentation et référencement

La page `/dostava` propose quatre cartes de résumé, un sommaire, les tarifs dynamiques, le suivi officiel et des liens de contact. Les tarifs deviennent des cartes lisibles sur mobile. Les styles sont limités à cette page. Le titre, la description et l'URL canonique sont définis ; la page autorise l'indexation et figure dans le sitemap.
