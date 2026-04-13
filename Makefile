#
# Makefile for the luci-app-parental-control LuCI application
#
# Copyright (C) 2024 Jules
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#	http://www.apache.org/licenses/LICENSE-2.0
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-parental-control
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=Parental Controls
LUCI_PKGARCH:=all
LUCI_DEPENDS:=

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
