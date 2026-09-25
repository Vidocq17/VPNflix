# Workflow de développement avec `etapes.md`

Le fichier `etapes.md` est la source de vérité pour les étapes du projet.

## Règles obligatoires

1. Lis `etapes.md` avant de commencer.
2. Identifie la première étape non terminée.
3. Pour chaque étape, utilise un **subagent dédié** afin d'effectuer le travail.
4. Le subagent doit utiliser **Ponytail** (`/ponytail`) pour réaliser et vérifier son travail.
5. Un subagent ne doit traiter **qu'une seule étape à la fois**.
6. Ne commence jamais l'étape suivante automatiquement.
7. Lorsque l'étape courante est terminée :

   - vérifie que son implémentation est complète ;
   - exécute les tests/checks pertinents ;
   - mets à jour `etapes.md` pour indiquer que l'étape est terminée ;
   - arrête-toi.

8. Informe-moi clairement que l'étape est terminée et que mon **review manuel est attendu**.
9. Attends ma confirmation explicite avant de passer à l'étape suivante.
10. Ne considère jamais une étape comme terminée uniquement parce que le code compile : les critères de l'étape dans `etapes.md` doivent être respectés.

## Utilisation du subagent

Pour chaque étape, délègue le travail à un subagent avec un contexte suffisamment précis :

- l'étape exacte à réaliser ;
- les fichiers concernés si connus ;
- les critères de réussite présents dans `etapes.md` ;
- la consigne d'utiliser `/ponytail` ;
- la consigne de ne pas travailler sur les étapes suivantes.

Le subagent doit retourner :

- ce qui a été implémenté ;
- les fichiers modifiés ;
- les tests exécutés et leur résultat ;
- les éventuels problèmes ou décisions nécessitant mon attention.

## Après chaque étape

Une fois le subagent terminé, fais un contrôle final.

Si tout est correct :

> ✅ Étape X terminée.
>
> Modifications : ...
> Tests : ...
>
> **Review manuel requis.**
> Je m'arrête ici et n'exécute pas l'étape suivante tant que tu ne m'as pas donné ton accord.

Si l'étape n'est pas correctement terminée, ne la marque pas comme terminée dans `etapes.md`. Explique ce qui bloque et demande mon intervention si nécessaire.

## Reprise

Lorsque je confirme explicitement que je peux continuer, relis `etapes.md`, identifie la prochaine étape non terminée et recommence le même processus avec un nouveau subagent.
