#!/usr/bin/env bash
# ==============================================================================
# Virtual Classroom - AWS EC2 (Ubuntu) Setup Script
# Run this script on a fresh Ubuntu 22.04 / 24.04 EC2 instance (t2.micro / t3.micro)
# ==============================================================================
set -e

echo ">>> [1/5] Updating packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo ">>> [2/5] Creating 2GB Swap space (prevents Out-Of-Memory on 1GB t2.micro during npm install)..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap file created successfully."
else
    echo "Swap file already exists."
fi

echo ">>> [3/5] Installing Node.js 20 LTS, Git, Nginx, and Certbot..."
sudo apt-get install -y curl git ufw nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo ">>> [4/5] Installing PM2 Process Manager globally..."
sudo npm install -g pm2

echo ">>> [5/5] Verifying installation..."
echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"
echo "PM2 version:  $(pm2 -v)"
echo "Nginx:        $(nginx -v 2>&1)"

echo ""
echo "=============================================================================="
echo "✅ EC2 Server Provisioning Complete!"
echo ""
echo "Next Steps:"
echo "1. Clone the repository: git clone https://github.com/DrishtiSharma7/Virtual-Classroom.git"
echo "2. cd Virtual-Classroom/backend"
echo "3. npm install --omit=dev"
echo "4. nano .env  (paste your MONGO_URI, JWT_SECRET, PORT=8000)"
echo "5. pm2 start ecosystem.config.js"
echo "6. pm2 startup && pm2 save"
echo "=============================================================================="
