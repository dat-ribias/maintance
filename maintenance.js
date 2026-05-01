"use strict";

/**
 * ============================================================
 *  Maintenance Mode Checker
 * ============================================================
 *  Kiểm tra trạng thái bảo trì từ App 402
 *  - id_app: 369
 *  - status: 0 = bảo trì, 1 = hoạt động
 * ============================================================
 */

var MAINTENANCE_APP_ID = 402;
var TARGET_APP_ID = 369;
var MAINTENANCE_API_TOKEN = ''; // TODO: Điền API token của app 402

export function checkMaintenanceMode() {
    return new Promise(function (resolve, reject) {
        var currentUser = kintone.getLoginUser();
        var query = "id_app = " + TARGET_APP_ID;
        var url = kintone.api.url('/k/v1/records', true) + '?app=' + MAINTENANCE_APP_ID + '&query=' + encodeURIComponent(query);

        fetch(url, {
            method: 'GET',
            headers: {
                'X-Cybozu-API-Token': MAINTENANCE_API_TOKEN
            }
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('API call failed');
                }
                return response.json();
            })
            .then(function (resp) {
                if (resp.records && resp.records.length > 0) {
                    var record = resp.records[0];
                    var status = parseInt(record.status.value, 10);
                    var bypassIds = record.id_by_pass ? record.id_by_pass.value : '';

                    // Check if current user is in individual bypass list
                    var bypassList = bypassIds.split(',').map(function (id) {
                        return id.trim();
                    }).filter(function (id) { return id !== ''; });

                    if (bypassList.indexOf(currentUser.code) !== -1) {
                        console.log('[Maintenance] Bypass for user:', currentUser.code);
                        resolve();
                        return;
                    }

                    // Read new detail fields
                    var maintStart = record.maintenance_start ? record.maintenance_start.value : '';
                    var maintEnd = record.maintenance_end ? record.maintenance_end.value : '';
                    var maintMsg = record.maintenance_message ? record.maintenance_message.value : '';

                    var isUnderMaintenance = status === 0;
                    if (!isUnderMaintenance) {
                        resolve();
                        return;
                    }

                    // Check group bypass using bypass_groups_code_id
                    var bypassGroupsCodeId = record.bypass_groups_code_id ? record.bypass_groups_code_id.value : '';
                    var bypassUserList = bypassGroupsCodeId.split(',').map(function (id) {
                        return id.trim();
                    }).filter(function (id) { return id !== ''; });

                    if (bypassUserList.indexOf(currentUser.code) !== -1) {
                        console.log('[Maintenance] Group bypass for user:', currentUser.code);
                        resolve();
                        return;
                    }

                    // User not in bypass list → show maintenance
                    showMaintenanceOverlay(maintStart, maintEnd, maintMsg);
                    reject(new Error('Under maintenance'));

                } else {
                    resolve();
                }
            })
            .catch(function (error) {
                console.warn('[Maintenance] Check failed (App 402 may not exist or no permission):', error);
                resolve();
            });
    });
}

function formatMaintenanceDate(isoStr) {
    if (!isoStr) return '';
    try {
        var d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        var y = d.getFullYear();
        var m = d.getMonth() + 1;
        var day = d.getDate();
        var h = ('0' + d.getHours()).slice(-2);
        var min = ('0' + d.getMinutes()).slice(-2);
        return y + '年' + m + '月' + day + '日 ' + h + ':' + min;
    } catch (e) {
        return isoStr;
    }
}

function showMaintenanceOverlay(maintStart, maintEnd, maintMsg) {
    var style = document.createElement('style');
    style.textContent = '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;600;700&display=swap");' +
        '@keyframes mt-float1{0%,100%{transform:translateY(0) scale(1);opacity:0.3}50%{transform:translateY(-30px) scale(1.1);opacity:0.6}}' +
        '@keyframes mt-float2{0%,100%{transform:translateY(0) scale(0.8);opacity:0.2}50%{transform:translateY(-50px) scale(1);opacity:0.5}}' +
        '@keyframes mt-float3{0%,100%{transform:translateY(0) scale(1.2);opacity:0.15}50%{transform:translateY(-20px) scale(0.9);opacity:0.4}}' +
        '@keyframes mt-pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.08)}}' +
        '@keyframes mt-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}' +
        '@keyframes mt-fadeIn{from{opacity:0;transform:translateY(30px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}' +
        '@keyframes mt-bgShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}' +
        '@keyframes mt-borderGlow{0%,100%{border-color:rgba(186,215,216,0.2)}50%{border-color:rgba(186,215,216,0.5)}}' +
        '#maintenance-overlay *{font-family:"Noto Sans JP","Yu Gothic",sans-serif;box-sizing:border-box}';
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'maintenance-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'background:linear-gradient(135deg,#1a2332 0%,#2d3e50 30%,#1a2332 60%,#263545 100%);' +
        'background-size:400% 400%;animation:mt-bgShift 12s ease infinite;' +
        'z-index:999999;display:flex;align-items:center;justify-content:center;' +
        'padding:20px;overflow:hidden;';

    // Floating particles with Ribias teal
    var particleConfigs = [
        { size: 80, left: '15%', bottom: '-20px', delay: '0s', dur: '6s', anim: 'mt-float1' },
        { size: 50, left: '65%', bottom: '-10px', delay: '1.5s', dur: '8s', anim: 'mt-float2' },
        { size: 120, left: '80%', bottom: '-30px', delay: '3s', dur: '7s', anim: 'mt-float3' },
        { size: 40, left: '35%', bottom: '-15px', delay: '2s', dur: '9s', anim: 'mt-float1' },
        { size: 60, left: '50%', bottom: '-25px', delay: '4s', dur: '6.5s', anim: 'mt-float2' }
    ];
    for (var i = 0; i < particleConfigs.length; i++) {
        var pc = particleConfigs[i];
        var particle = document.createElement('div');
        particle.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;' +
            'background:radial-gradient(circle,rgba(186,215,216,0.3),transparent 70%);' +
            'width:' + pc.size + 'px;height:' + pc.size + 'px;' +
            'left:' + pc.left + ';bottom:' + pc.bottom + ';' +
            'animation:' + pc.anim + ' ' + pc.dur + ' ease-in-out ' + pc.delay + ' infinite;';
        overlay.appendChild(particle);
    }

    // Glassmorphism card
    var box = document.createElement('div');
    box.style.cssText = 'background:rgba(255,255,255,0.07);' +
        'backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);' +
        'border:1px solid rgba(186,215,216,0.25);border-radius:24px;' +
        'padding:48px 40px 40px;text-align:center;max-width:460px;width:100%;' +
        'box-shadow:0 8px 60px rgba(0,0,0,0.4),0 0 40px rgba(186,215,216,0.08);' +
        'animation:mt-fadeIn 0.6s ease-out,mt-borderGlow 4s ease-in-out infinite;' +
        'position:relative;overflow:hidden;';

    // Top accent line
    var topAccent = document.createElement('div');
    topAccent.style.cssText = 'position:absolute;top:0;left:50%;transform:translateX(-50%);' +
        'width:120px;height:3px;background:linear-gradient(90deg,transparent,#BAD7D8,transparent);' +
        'border-radius:0 0 4px 4px;';
    box.appendChild(topAccent);

    // Icon with teal glow
    var iconWrap = document.createElement('div');
    iconWrap.style.cssText = 'width:80px;height:80px;margin:0 auto 24px;' +
        'background:linear-gradient(135deg,rgba(186,215,216,0.15),rgba(186,215,216,0.05));' +
        'border-radius:50%;display:flex;align-items:center;justify-content:center;' +
        'box-shadow:0 0 30px rgba(186,215,216,0.15);animation:mt-pulse 3s ease-in-out infinite;' +
        'border:1px solid rgba(186,215,216,0.2);';
    iconWrap.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" ' +
        'stroke="#BAD7D8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>' +
        '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>';
    box.appendChild(iconWrap);

    // RIBIAS badge
    var badge = document.createElement('div');
    badge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;' +
        'background:rgba(186,215,216,0.1);border:1px solid rgba(186,215,216,0.2);' +
        'border-radius:20px;padding:4px 14px;margin-bottom:20px;' +
        'font-size:11px;color:rgba(186,215,216,0.8);letter-spacing:1.5px;font-weight:600;';
    badge.textContent = 'RIBIAS SYSTEM';
    box.appendChild(badge);

    // Title
    var title = document.createElement('h2');
    title.style.cssText = 'margin:0 0 12px;font-size:26px;font-weight:700;color:#fff;' +
        'letter-spacing:0.5px;text-shadow:0 2px 10px rgba(0,0,0,0.3);';
    title.textContent = 'システムメンテナンス中';
    box.appendChild(title);

    // Subtitle
    var subtitle = document.createElement('p');
    subtitle.style.cssText = 'margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.5);' +
        'font-weight:300;letter-spacing:0.5px;';
    subtitle.textContent = 'System Maintenance';
    box.appendChild(subtitle);

    // Divider
    var divider = document.createElement('div');
    divider.style.cssText = 'width:60px;height:2px;margin:16px auto 20px;' +
        'background:linear-gradient(90deg,transparent,#BAD7D8,transparent);border-radius:2px;';
    box.appendChild(divider);

    // Schedule info (if maintenance_start or maintenance_end provided)
    if (maintStart || maintEnd) {
        var scheduleBox = document.createElement('div');
        scheduleBox.style.cssText = 'background:rgba(186,215,216,0.08);border:1px solid rgba(186,215,216,0.15);' +
            'border-radius:12px;padding:16px 20px;margin:0 0 20px;text-align:center;';

        var schedTitle = document.createElement('div');
        schedTitle.style.cssText = 'font-size:12px;color:rgba(186,215,216,0.8);font-weight:600;' +
            'letter-spacing:1px;margin-bottom:12px;';
        schedTitle.textContent = '⏱ メンテナンス予定';
        scheduleBox.appendChild(schedTitle);

        if (maintStart) {
            var startRow = document.createElement('div');
            startRow.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin-bottom:6px;' +
                'font-size:14px;color:rgba(255,255,255,0.75);';
            startRow.innerHTML = '<span style="color:#BAD7D8;font-weight:600;">開始:</span>' +
                '<span>' + formatMaintenanceDate(maintStart) + '</span>';
            scheduleBox.appendChild(startRow);
        }
        if (maintStart && maintEnd) {
            var arrow = document.createElement('div');
            arrow.style.cssText = 'font-size:13px;color:rgba(186,215,216,0.5);margin:4px 0;';
            arrow.textContent = '▼';
            scheduleBox.appendChild(arrow);
        }
        if (maintEnd) {
            var endRow = document.createElement('div');
            endRow.style.cssText = 'display:inline-flex;align-items:center;gap:8px;' +
                'font-size:14px;color:rgba(255,255,255,0.75);';
            endRow.innerHTML = '<span style="color:#BAD7D8;font-weight:600;">終了:</span>' +
                '<span>' + formatMaintenanceDate(maintEnd) + '</span>';
            scheduleBox.appendChild(endRow);
        }
        box.appendChild(scheduleBox);
    }

    // Message – custom or default
    if (maintMsg) {
        var msgBox = document.createElement('div');
        msgBox.style.cssText = 'background:rgba(255,200,50,0.08);border:1px solid rgba(255,200,50,0.2);' +
            'border-radius:12px;padding:16px 20px;margin:0 0 24px;text-align:center;';

        var msgIcon = document.createElement('div');
        msgIcon.style.cssText = 'font-size:12px;color:rgba(255,200,50,0.8);font-weight:600;' +
            'letter-spacing:1px;margin-bottom:8px;';
        msgIcon.textContent = '📋 メンテナンス内容';
        msgBox.appendChild(msgIcon);

        var msgText = document.createElement('div');
        msgText.style.cssText = 'font-size:14px;color:rgba(255,255,255,0.85);line-height:1.8;font-weight:400;';
        msgText.innerHTML = maintMsg.replace(/\n/g, '<br>');
        msgBox.appendChild(msgText);

        box.appendChild(msgBox);
    }

    var msg = document.createElement('p');
    msg.style.cssText = 'margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.5);' +
        'line-height:1.8;font-weight:300;';
    msg.innerHTML = '現在、システムのメンテナンスを実施しております。<br>しばらくお待ちください。';
    box.appendChild(msg);

    // Progress bar
    var progressWrap = document.createElement('div');
    progressWrap.style.cssText = 'width:100%;height:3px;background:rgba(255,255,255,0.08);' +
        'border-radius:3px;margin-bottom:28px;overflow:hidden;';
    var progressBar = document.createElement('div');
    progressBar.style.cssText = 'width:40%;height:100%;' +
        'background:linear-gradient(90deg,transparent,#BAD7D8,rgba(186,215,216,0.4),transparent);' +
        'background-size:200% 100%;animation:mt-shimmer 2s linear infinite;border-radius:3px;';
    progressWrap.appendChild(progressBar);
    box.appendChild(progressWrap);

    // Button
    var btn = document.createElement('button');
    btn.style.cssText = 'background:linear-gradient(135deg,#8db8b9,#BAD7D8,#a3c9ca);' +
        'background-size:200% 200%;color:#1a2332;border:none;padding:14px 52px;' +
        'font-size:15px;font-weight:600;border-radius:14px;cursor:pointer;' +
        'transition:all 0.3s cubic-bezier(0.4,0,0.2,1);' +
        'box-shadow:0 4px 20px rgba(186,215,216,0.3);letter-spacing:1px;';
    btn.textContent = 'OK';
    btn.onmouseover = function () {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 8px 30px rgba(186,215,216,0.5)';
    };
    btn.onmouseout = function () {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 4px 20px rgba(186,215,216,0.3)';
    };
    btn.onclick = function () { window.location.href = 'https://ribias-m.cybozu.com/k/#/portal'; };
    box.appendChild(btn);

    // Footer
    var footer = document.createElement('div');
    footer.style.cssText = 'margin-top:24px;font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:0.5px;';
    footer.textContent = '© RIBIAS Co., Ltd.';
    box.appendChild(footer);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

(function () {
    kintone.events.on(['app.record.index.show', 'app.record.detail.show', 'app.record.edit.show', 'app.record.create.show'], function (event) {
        return checkMaintenanceMode().then(function () {
            return event;
        }).catch(function () {
            return false;
        });
    });
})();
