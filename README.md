# Annotate-on

Annotate-on est une annoteuse collaborative rapide initialement développée pour les **sciences naturalistes** par le laboratoire [Dicen-idf](https://www.dicen-idf.org), pour l'infrastructure nationale de recherche [Recolnat](https://www.recolnat.org) regroupant notamment le [Cnam](https://www.cnam.fr) et le [MNHN](https://www.mnhn.fr).

Elle a ensuite été étendue à l'utilisation en **humanités numériques** par le laboratoire Dicen-IdF dans le cadre du projet OPAAH-IIIF au sein du Labex [Les passés dans le présent](http://passes-present.eu/).

Annotate-on fonctionne sur Windows et Mac OS-X.

# Annotate-on pour les sciences naturalistes

Il a été conçu pour l’annotation d’herbier et de collections en zoologie ou paléontologie, constitués d’images standardisées, dans un contexte de tâches très homogènes et répétitives sur des dizaines ou centaines d’images, portant sur des projets de recherche très variés. La combinaison, dans le même outil Annotate-on, d’annotations situées spatialement dans des images accessibles sur le web et d’une ergonomie propre aux métiers de la recherche naturaliste dans le même outil Recolnat Annotate offre au chercheur la possibilité de manipuler et analyser des corpus de plusieurs centaines de planches et de constituer de tableaux de résultats d’observations utilisables dans des outils tiers en quelques heures.

Annotate offre actuellement plusieurs gammes d’outils aux chercheurs :

- Une palette pour effectuer des mesures physiques (longueur, angle), propres aux sciences naturalistes.
- Une autre palette pour marquer et commenter zones et points d’intérêts dans les images, dénombrer des éléments, transcrire des étiquettes manuscrites ou typographiques.
- Un tagueur d’images et d’annotations offrant :
  - Un éditeur de modèles d’annotations.
  - Un couplage avec Xper, outil d’identification doté d’un puissant éditeur collaboratif de données descriptives, développé pour la biodiversité et utilisable dans tout autre domaine pour des identifications sur des ensembles de critères catégoriques ou numériques.
  - Un éditeur de métadonnées compatible Dublin Core.
  - Un éditeur de collections virtuelles (en cours de développement) pour constituer des séquences d’images à exposer, écrire sur ces images, éditer leurs cartels, les exporter.
  - Une API et un serveur Recolnat IIIF de présentation (en cours de développement)

En 2022-2023, un mode Annotation 3D sera implémenté.

# Annotate-on pour les humanités numériques

Anntate-on permet d'annoter des corpus hétérogènes composés à la fois d'images fixes et de films.

En plus de ses fonctions d'annotation d'images, Annotate-on propose 2 autres modes d'annotation.

Un mode "Annotation chrono-thématique" de vidéos qui permet de segmenter un film téléchargé en séquences temporelles, ceci selon un modèle classique en archives (dans les institutions françaises (Archives nationales, BnF).

Un mode "Event" pour annoter chronologiquement en direct un événement, en même temps que cet événement se déroule, parallèlement à sa captation vidéo ou audio. ce mode a été développé pour les procès filmés. Il est mis en oeuvre actuellement pour le procès des Attentats du 13 novembre 2015. L'évolution vers davantage de procès filmés rend a priori pertinent cette fonctionnalité.

Un 3e mode sera développé en 2022 pour annoter et suivre des objets à l'intérieur d'une séquence filmée (un personnage par exemple).

# Technologies

Annotate-on est une [Electron](https://electronjs.org/), [React](https://reactjs.org/), [Redux](https://redux.js.org/) application.

L'application est basée sur le template [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate).

## Installation

1. Installer NodeJS [v12 Erbium](https://nodejs.org/download/release/latest-erbium/) pour votre plateforme (https://nodejs.org/download/release/latest-erbium/).

2. Cloner le code avec le git

```bash
git clone --depth 1 --branch main https://github.com/Annotate-on/Annotate-on
```

3. Installer [Yarn](https://classic.yarnpkg.com/)

```bash
npm install --global yarn
```

4. Installer dépendances:

```bash
yarn install
```

## Démarrer le mode développement

Démarrage de l'application dans l'environment `dev`:

```bash
yarn dev
```

## Création fichier installation

Pour packager l'application pour la plateforme locale:

```bash
yarn package
```
