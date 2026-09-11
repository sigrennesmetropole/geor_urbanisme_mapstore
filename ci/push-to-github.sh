#!/bin/bash

GITHUB_RM_URL="github.com/sigrennesmetropole/geor_urbanisme_mapstore.git"

if [ ! -z "$DEBUG" ]; then
set -x
fi

if [ ! -z "$GIT_FORCE" ]; then
FORCE="--force"
fi

echo "Checking variables..."

if [ -z "$SOURCE_REPOSITORY" ]; then
  echo 'Please specify SOURCE_REPOSITORY variable'
  exit 1
fi

# Le dossier source doit obligatoirement finir par un "/" si on souhaite que rsync soit récursif
[[ $SOURCE_REPOSITORY == */ ]] || SOURCE_REPOSITORY+=/

if [ -z "$COMMIT_MESSAGE" ]; then
  echo 'Please specify COMMIT_MESSAGE variable'
  exit 1
fi
echo "COMMIT_MESSAGE=$COMMIT_MESSAGE"

# Please check that you use a GitHub account with appropriate email
if [ -z "$GITHUB_RM_LOGIN" ]; then
  echo 'Please specify GITHUB_RM_LOGIN variable'
  exit 1
fi

# Please check that you use a GitHub account with appropriate username
if [ -z "$GITHUB_RM_ACCOUNT" ]; then
  echo 'Please specify GITHUB_RM_ACCOUNT variable'
  exit 1
fi

# Please check that you use a GitHub token (classic) that has not expired and has "delete:packages, repo, workflow, write:packages" scopes.
if [ -z "$GIT_TOKEN" ]; then
  echo 'Please specify GIT_TOKEN variable'
  exit 1
fi

DESTINATION_REPOSITORY=/tmp/geor_urbanisme_mapstore
[ -z "$GIT_REMOTE" ] && GIT_REMOTE="https://$GITHUB_RM_ACCOUNT:$GIT_TOKEN@$GITHUB_RM_URL"
[ -z "$PRODUCTION_REMOTE_BRANCH" ] && PRODUCTION_REMOTE_BRANCH="master"
TEMP_DIRECTORY=/tmp

echo "Cloning from https://$GITHUB_RM_URL to destination repository : $DESTINATION_REPOSITORY/..."
git clone "$GIT_REMOTE" "$DESTINATION_REPOSITORY/"

echo "Checkout of remote branch $PRODUCTION_REMOTE_BRANCH"
cd "$DESTINATION_REPOSITORY/"
git checkout "$PRODUCTION_REMOTE_BRANCH"
cd -

echo "Syncing source $SOURCE_REPOSITORY to target $DESTINATION_REPOSITORY/..."

# Backup .git (git back Jojo !) directory from destination (deleted by "--delete-excluded")
mv $DESTINATION_REPOSITORY/.git $TEMP_DIRECTORY/.git.back


if [ ! -z "$DEBUG" ]; then
ls -a $DESTINATION_REPOSITORY/.git
ls -a $TEMP_DIRECTORY/.git.back
fi

rsync \
  --archive \
  --exclude-from="$SOURCE_REPOSITORY/.gitignore" \
  --filter="merge push-to-github-filter.txt" \
  --delete-excluded \
  --delete-during \
  --verbose \
  "$SOURCE_REPOSITORY" "$DESTINATION_REPOSITORY/"

# Restore .git directory to destination
if [ ! -z "$DEBUG" ]; then
ls -al $TEMP_DIRECTORY/.git.back
fi

mv $TEMP_DIRECTORY/.git.back/* $DESTINATION_REPOSITORY/.git

ls -al $DESTINATION_REPOSITORY/.git

# Sync the MapStore2 submodule pointer explicitly.
# rsync excludes /MapStore2/** (see push-to-github-filter.txt) because a git submodule
# reference is a "gitlink" entry in the git tree, not a regular file rsync can copy.
# Without this step, the destination repo's MapStore2 pointer stays frozen at whatever
# commit it was last set to, while package-lock.json (synced from source) reflects a
# different MapStore2 dependency tree -- causing npm ci to fail on the destination repo.
echo "Syncing MapStore2 submodule pointer..."
MAPSTORE2_SHA=$(git -C "$SOURCE_REPOSITORY" rev-parse HEAD:MapStore2)
echo "Source MapStore2 SHA: $MAPSTORE2_SHA"
git -C "$DESTINATION_REPOSITORY" submodule update --init MapStore2
git -C "$DESTINATION_REPOSITORY/MapStore2" fetch --depth 1 origin "$MAPSTORE2_SHA" || git -C "$DESTINATION_REPOSITORY/MapStore2" fetch origin
git -C "$DESTINATION_REPOSITORY/MapStore2" checkout "$MAPSTORE2_SHA"

# Commit and push
cd "$DESTINATION_REPOSITORY"
echo "Committing and pushing to https://$GITHUB_RM_URL..."
git config user.name "$GITHUB_RM_ACCOUNT"
git config user.email "$GITHUB_RM_LOGIN"
git add --all
git commit --message "$COMMIT_MESSAGE"
git push $FORCE "$GIT_REMOTE"

echo "Done."
