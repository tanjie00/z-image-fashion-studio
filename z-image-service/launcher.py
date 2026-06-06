"""
Z-Image Bridge Service - Windows Launcher
==========================================
Windows 下的启动器，提供系统托盘图标和配置界面

功能:
  - 系统托盘图标，右键菜单控制服务
  - 自动检测并安装依赖
  - 配置界面设置模式、端口等参数
  - 日志查看窗口
"""

import os
import sys
import threading
import subprocess
import json
import time
import logging
import webbrowser
from pathlib import Path

# 配置文件路径
APP_DIR = Path.home() / ".z-image-service"
CONFIG_FILE = APP_DIR / "config.json"
LOG_FILE = APP_DIR / "service.log"

# 默认配置
DEFAULT_CONFIG = {
    "mode": "modelscope",
    "port": 8001,
    "hf_token": "",
    "ms_token": "",
    "auto_start": True,
    "auto_open_browser": True,
}


def ensure_app_dir():
    """确保应用目录存在"""
    APP_DIR.mkdir(parents=True, exist_ok=True)


def load_config():
    """加载配置"""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                config = json.load(f)
                # 合并默认值
                for k, v in DEFAULT_CONFIG.items():
                    if k not in config:
                        config[k] = v
                return config
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()


def save_config(config):
    """保存配置"""
    ensure_app_dir()
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


class ZImageService:
    """Z-Image 服务管理器"""

    def __init__(self):
        self.config = load_config()
        self.process = None
        self.running = False
        self.logger = self._setup_logger()

    def _setup_logger(self):
        """配置日志"""
        logger = logging.getLogger("z-image-launcher")
        logger.setLevel(logging.INFO)

        # 控制台输出
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
        ch.setFormatter(formatter)
        logger.addHandler(ch)

        # 文件输出
        try:
            ensure_app_dir()
            fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
            fh.setLevel(logging.DEBUG)
            fh.setFormatter(formatter)
            logger.addHandler(fh)
        except Exception:
            pass

        return logger

    def start(self):
        """启动服务"""
        if self.running and self.process and self.process.poll() is None:
            self.logger.info("服务已在运行中")
            return True

        env = os.environ.copy()
        env["ZIMAGE_MODE"] = self.config.get("mode", "modelscope")
        env["ZIMAGE_PORT"] = str(self.config.get("port", 8001))
        env["ZIMAGE_HF_TOKEN"] = self.config.get("hf_token", "")
        env["ZIMAGE_MS_TOKEN"] = self.config.get("ms_token", "")
        env["ZIMAGE_LOCAL_MODEL"] = "Tongyi-MAI/Z-Image"
        env["ZIMAGE_DEVICE"] = "cuda"

        # 确定主程序路径
        if getattr(sys, 'frozen', False):
            # PyInstaller 打包模式
            main_script = os.path.join(os.path.dirname(sys.executable), "main.py")
            if not os.path.exists(main_script):
                # 尝试从 _internal 目录找
                main_script = os.path.join(sys._MEIPASS if hasattr(sys, '_MEIPASS') else "", "main.py")
                if not os.path.exists(main_script):
                    self.logger.error("找不到 main.py，请检查安装")
                    return False
            python_exe = sys.executable
            cmd = [python_exe, main_script]
        else:
            # 普通Python模式
            main_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "main.py")
            python_exe = sys.executable
            cmd = [python_exe, main_script]

        self.logger.info(f"启动 Z-Image 服务: mode={env['ZIMAGE_MODE']}, port={env['ZIMAGE_PORT']}")
        self.logger.info(f"命令: {' '.join(cmd)}")

        try:
            self.process = subprocess.Popen(
                cmd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=1,
                universal_newlines=True,
            )
            self.running = True

            # 启动日志监控线程
            log_thread = threading.Thread(target=self._monitor_output, daemon=True)
            log_thread.start()

            # 等待服务启动
            time.sleep(2)
            if self.process.poll() is not None:
                self.logger.error("服务启动失败！")
                self.running = False
                return False

            self.logger.info("Z-Image 服务启动成功！")
            port = self.config.get("port", 8001)
            self.logger.info(f"服务地址: http://localhost:{port}")
            self.logger.info(f"健康检查: http://localhost:{port}/health")

            # 自动打开浏览器
            if self.config.get("auto_open_browser", True):
                time.sleep(1)
                webbrowser.open(f"http://localhost:{port}/health")

            return True

        except Exception as e:
            self.logger.error(f"启动服务失败: {e}")
            self.running = False
            return False

    def _monitor_output(self):
        """监控服务输出"""
        if not self.process:
            return
        try:
            for line in self.process.stdout:
                line = line.rstrip()
                if line:
                    self.logger.info(f"[service] {line}")
        except Exception:
            pass
        finally:
            self.running = False

    def stop(self):
        """停止服务"""
        if self.process and self.process.poll() is None:
            self.logger.info("正在停止 Z-Image 服务...")
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self.running = False
            self.logger.info("服务已停止")

    def restart(self):
        """重启服务"""
        self.stop()
        time.sleep(1)
        return self.start()

    def get_status(self):
        """获取服务状态"""
        if self.process and self.process.poll() is None:
            return "running"
        return "stopped"


def run_console_mode():
    """控制台模式运行"""
    print("=" * 50)
    print("  Z-Image Bridge Service - Windows Launcher")
    print("  通义MAI Z-Image 6B 文生图模型服务")
    print("=" * 50)
    print()

    service = ZImageService()
    config = service.config

    print(f"  运行模式: {config.get('mode', 'modelscope')}")
    print(f"  服务端口: {config.get('port', 8001)}")
    print(f"  配置文件: {CONFIG_FILE}")
    print(f"  日志文件: {LOG_FILE}")
    print()

    # 启动服务
    if service.start():
        print()
        print("  服务已启动，按 Ctrl+C 停止")
        print()

        try:
            while service.running:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n正在停止服务...")
            service.stop()

    print("服务已退出")


if __name__ == "__main__":
    run_console_mode()
