# GitHub Actions 工作流说明

## 关于 Workflow 权限

当前 GitHub Token 只有 `repo` 权限，无法直接推送 `.github/workflows/` 文件。
需要通过 GitHub 网页界面手动添加 workflow 文件。

## 启用 Windows EXE 自动构建

### 方法一：通过 GitHub 网页添加（推荐）

1. 打开仓库 https://github.com/tanjie00/z-image-fashion-studio
2. 点击 **Add file** → **Create new file**
3. 文件路径输入 `.github/workflows/build-windows-exe.yml`
4. 将 `build-windows-exe.yml` 的内容粘贴进去
5. 点击 **Commit changes**

### 方法二：使用带 workflow 权限的 Token

1. 前往 GitHub Settings → Developer settings → Personal access tokens
2. 创建新 Token，勾选 `repo` 和 `workflow` 权限
3. 使用新 Token 推送包含 workflow 的代码

### 方法三：手动触发构建

即使没有 workflow，也可以使用以下方法构建 Windows EXE：

1. 在 Windows 机器上克隆项目
2. 进入 `z-image-service/` 目录
3. 运行 `build-exe.bat`
4. 构建完成后在 `dist/` 目录找到 EXE 文件

## 发布 Release

添加 workflow 后，推送 tag 即可自动构建并发布：

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动：
1. 在 Windows 环境构建 EXE
2. 运行健康检查测试
3. 创建 GitHub Release 并上传 EXE 文件
