# -*- mode: python ; coding: utf-8 -*-
"""
Z-Image Bridge Service PyInstaller Spec
========================================
将 Z-Image Python 服务打包为独立可执行文件

使用方法:
  pyinstaller z-image-service.spec

生成的可执行文件在 dist/ 目录下
"""

import sys
import os

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'fastapi',
        'fastapi.middleware',
        'fastapi.middleware.cors',
        'pydantic',
        'pydantic.fields',
        'pydantic.main',
        'pydantic.types',
        'pydantic.validators',
        'pydantic.schema',
        'anyio._backends._asyncio',
        'httpcore',
        'httpcore._async',
        'httpcore._sync',
        'httpx',
        'httpx._transports',
        'httpx._transports.default',
        'h11',
        'sniffio',
        'gradio_client',
        'gradio_client.client',
        'websockets',
        'websockets.legacy',
        'websockets.legacy.client',
        'json',
        'tempfile',
        'base64',
        'io',
        'logging',
        'typing',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'numpy',
        'PIL',
        'scipy',
        'pandas',
        'IPython',
        'jupyter',
        'notebook',
        'selenium',
        'pytest',
    ],
    noarchive=False,
    optimize=1,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Z-Image-Service',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
    version=None,
)
