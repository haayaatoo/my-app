# Prodia 自動コミット・プッシュスクリプト
param([string]$Message = "")

function Write-ColorLog($Text, $Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

Write-ColorLog "🚀 Prodia自動コミット・プッシュシステム開始..." "Cyan"

# Gitリポジトリ確認
if (!(Test-Path ".git")) {
    Write-ColorLog "❌ エラー: Gitリポジトリが見つかりません。" "Red"
    exit 1
}

# 変更ファイル確認
$status = git status --porcelain
if (!$status) {
    Write-ColorLog "✅ コミットする変更がありません。" "Green"
    exit 0
}

Write-ColorLog "📋 変更されたファイル:" "Yellow"
git status --short

# 自動コミットメッセージ生成
if ([string]::IsNullOrWhiteSpace($Message)) {
    $timestamp = Get-Date -Format "yyyy/MM/dd HH:mm:ss"
    $Message = "🔧 Auto-commit at $timestamp"
}

Write-ColorLog "📝 コミットメッセージ: $Message" "Magenta"

# ステージング
Write-ColorLog "📦 ファイルをステージング中..." "Yellow"
git add .

if ($LASTEXITCODE -ne 0) {
    Write-ColorLog "❌ ステージングに失敗しました。" "Red"
    exit 1
}

# コミット実行
Write-ColorLog "💾 コミット実行中..." "Yellow"
git commit -m $Message

if ($LASTEXITCODE -ne 0) {
    Write-ColorLog "❌ コミットに失敗しました。" "Red"
    exit 1
}

# プッシュ
Write-ColorLog "⬆️  GitHubにプッシュ中..." "Yellow"
git push

if ($LASTEXITCODE -ne 0) {
    Write-ColorLog "🌱 初回プッシュまたは新しいブランチを設定..." "Cyan"
    $currentBranch = git rev-parse --abbrev-ref HEAD
    git push -u origin $currentBranch
}

if ($LASTEXITCODE -ne 0) {
    Write-ColorLog "❌ プッシュに失敗しました。リモートリポジトリを確認してください。" "Red"
    exit 1
}

# 成功メッセージ
Write-ColorLog ""
Write-ColorLog "✅ 自動コミット・プッシュが完了しました！" "Green"
Write-ColorLog "📊 最新の状態:" "Cyan"
git log --oneline -3

$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-ColorLog ""
    Write-ColorLog "🌐 リモートリポジトリ: $remoteUrl" "Blue"
}