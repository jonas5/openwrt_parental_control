#!/bin/bash

APK=/usr/src/openwrt/staging_dir/host/bin/apk-bin
APK_DIR=/usr/src/openwrt/bin/packages/aarch64_cortex-a53
PKG_DIR=/usr/src/openwrt/feeds/luci/applications/luci-app-parental-control
IDIR=/tmp/luci-apk-final

REV_FILE=$PKG_DIR/.revision
if [ -f "$REV_FILE" ]; then
  REV=$(cat $REV_FILE)
  REV=$((REV + 1))
else
  REV=52
fi
echo $REV > $REV_FILE
VERSION="1.0.0-r$REV"

rm -rf $IDIR $APK_DIR/luci-app-parental-control*.apk

mkdir -p $IDIR/www/luci-static/resources/parental-control
mkdir -p $IDIR/www/luci-static/resources/view
mkdir -p $IDIR/etc/config
mkdir -p $IDIR/etc/init.d
mkdir -p $IDIR/usr/share/luci/menu.d
mkdir -p $IDIR/usr/share/rpcd/acl.d
mkdir -p $IDIR/usr/share/rpcd/ucode
mkdir -p $IDIR/usr/share/parental-control
mkdir -p $IDIR/usr/lib/lua/luci/controller
mkdir -p $IDIR/usr/lib/lua/luci/view/parental_control

cp $PKG_DIR/htdocs/luci-static/resources/parental-control/* $IDIR/www/luci-static/resources/parental-control/
cp $PKG_DIR/htdocs/luci-static/resources/view/parental_control.js $IDIR/www/luci-static/resources/view/
cp $PKG_DIR/root/etc/config/* $IDIR/etc/config/
cp $PKG_DIR/root/etc/init.d/* $IDIR/etc/init.d/
chmod 755 $IDIR/etc/init.d/parental-control
cp $PKG_DIR/root/usr/share/luci/menu.d/*.json $IDIR/usr/share/luci/menu.d/
cp $PKG_DIR/root/usr/share/rpcd/acl.d/*.json $IDIR/usr/share/rpcd/acl.d/
cp $PKG_DIR/root/usr/share/rpcd/ucode/* $IDIR/usr/share/rpcd/ucode/
cp $PKG_DIR/root/usr/share/parental-control/* $IDIR/usr/share/parental-control/
chmod 755 $IDIR/usr/share/parental-control/tracker.sh
cp $PKG_DIR/luasrc/controller/*.lua $IDIR/usr/lib/lua/luci/controller/
cp $PKG_DIR/luasrc/view/parental_control/*.htm $IDIR/usr/lib/lua/luci/view/parental_control/

$APK mkpkg \
  --rootnode \
  --info "name:luci-app-parental-control" \
  --info "version:$VERSION" \
  --info "arch:noarch" \
  --info "description:LuCI Parental Control" \
  --files "$IDIR" \
  --output "$APK_DIR/luci-app-parental-control-$VERSION.apk" 2>&1

ls -la $APK_DIR/luci-app-parental-control-$VERSION.apk
echo "Revision: $REV"
