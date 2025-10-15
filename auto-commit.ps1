# Prodia 自動コミット・プッシュスクリプト
# 使用方法: .\auto-commit.ps1 [コミットメッセージ]

param(
    [string]$Message = ""
)

# 色付きログ関数
function Write-ColorLog {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

# エラーハンドリング関数
function Handle-Error {
    param($ErrorMessage)
    Write-ColorLog "❌ エラー: $ErrorMessage" "Red"
    exit 1
}

Write-ColorLog "🚀 Prodia自動コミット・プッシュシステム開始..." "Cyan"

# 1. Gitリポジトリ確認
if (!(Test-Path ".git")) {
    Handle-Error "Gitリポジトリが見つかりません。プロジェクトルートで実行してください。"
}

# 2. 変更ファイル確認
$status = git status --porcelain
if (!$status) {
    Write-ColorLog "✅ コミットする変更がありません。" "Green"
    exit 0
}

Write-ColorLog "📋 変更されたファイル:" "Yellow"
git status --short

# 3. 自動コミットメッセージ生成
if ([string]::IsNullOrWhiteSpace($Message)) {
    $timestamp = Get-Date -Format "yyyy/MM/dd HH:mm:ss"
    
    # 変更ファイル数を取得（エラー無視）
    $addedFiles = @(git ls-files --others --exclude-standard 2>$null).Count
    $modifiedFiles = @(git diff --name-only HEAD 2>$null).Count
    
    if ($addedFiles -gt 0 -and $modifiedFiles -gt 0) {
        $Message = "✨ Auto-commit: Added $addedFiles file(s), Modified $modifiedFiles file(s)"
    } elseif ($addedFiles -gt 0) {
        $Message = "➕ Auto-commit: Added $addedFiles new file(s) at $timestamp"
    } elseif ($modifiedFiles -gt 0) {
        $Message = "🔧 Auto-commit: Updated $modifiedFiles file(s) at $timestamp"
    } else {
        $Message = "🔧 Auto-update at $timestamp"
    }
}

Write-ColorLog "📝 コミットメッセージ: $Message" "Magenta"

# 4. ステージング
Write-ColorLog "📦 ファイルをステージング中..." "Yellow"
git add .

if ($LASTEXITCODE -ne 0) {
    Handle-Error "ファイルのステージングに失敗しました。"
}

# 5. コミット実行
Write-ColorLog "💾 コミット実行中..." "Yellow"
git commit -m $Message

if ($LASTEXITCODE -ne 0) {
    Handle-Error "コミットに失敗しました。"
}

# 6. リモートブランチ確認
$currentBranch = git rev-parse --abbrev-ref HEAD
$remoteExists = git ls-remote --heads origin $currentBranch 2>$null

if (!$remoteExists) {
    Write-ColorLog "🌱 新しいブランチをリモートに作成します: $currentBranch" "Cyan"
    git push -u origin $currentBranch
} else {
    Write-ColorLog "⬆️  GitHubにプッシュ中..." "Yellow"
    git push
}

if ($LASTEXITCODE -ne 0) {
    Handle-Error "プッシュに失敗しました。リモートリポジトリの設定を確認してください。"
}

# 7. 成功メッセージ
Write-ColorLog ""
Write-ColorLog "✅ 自動コミット・プッシュが完了しました！" "Green"
Write-ColorLog "📊 最新の状態:" "Cyan"
git log --oneline -3

# 8. リモートリポジトリURL表示
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-ColorLog ""
    Write-ColorLog "🌐 リモートリポジトリ: $remoteUrl" "Blue"
}