document.addEventListener("DOMContentLoaded", () => {
  const inp = document.querySelector("#inp");
  const btn = document.querySelector("#btn");
  const boxes = document.querySelectorAll(".box");

  // استرجاع القيم المخزنة في localStorage عند تحميل الصفحة
  function loadBoxTitles() {
    boxes.forEach((box, index) => {
      const title = localStorage.getItem(`box${index + 1}`);
      if (title) {
        const inputTitle = box.querySelector(".box-title");
        inputTitle.value = title;
      }
    });
  }

  // استرجاع العناصر المخزنة في localStorage عند تحميل الصفحة
  function loadItems() {
    const allItems = JSON.parse(localStorage.getItem("items")) || [];
    allItems.forEach((item) => {
      addItem(item.text, item.boxIndex, false); // false تعني عدم إضافة عنصر جديد، بل تحديث الموقع
    });
  }

  loadBoxTitles();
  loadItems();

  btn.onclick = (e) => {
    e.preventDefault();
    addItemIfValid();
  };

  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItemIfValid();
    }
  });

  function addItemIfValid() {
    const value = inp.value.trim();
    if (value !== "") {
      addItem(value, 0, true); // true تعني إضافة عنصر جديد
      inp.value = "";
    }
  }

  function addItem(text, boxIndex, isNew) {
    const item = document.createElement("p");
    item.textContent = text;
    item.className = "item";
    item.draggable = true;

    // افترضنا أن العنصر يضاف إلى الصندوق بناءً على boxIndex
    const targetBox = boxes[boxIndex];
    const container = targetBox.querySelector(".container");

    if (isNew) {
      container.insertBefore(item, container.firstChild);
    } else {
      const existingItem = Array.from(container.querySelectorAll(".item")).find(
        (i) => i.textContent === text
      );
      if (existingItem) {
        existingItem.remove();
      }
      container.insertBefore(item, container.firstChild);
    }

    initializeDragEvents(item);

    // حفظ العناصر في localStorage
    updateLocalStorage();
  }

  function initializeDragEvents(item) {
    let drag = null;

    item.addEventListener("dragstart", () => {
      drag = item;
      item.style.opacity = "0.5";
    });

    item.addEventListener("dragend", () => {
      drag = null;
      item.style.opacity = "1";
    });

    boxes.forEach((box) => {
      const input = box.querySelector("input");
      const container = box.querySelector(".container");
      box.addEventListener("dragover", (e) => {
        e.preventDefault();
        box.style.backgroundColor = box.getAttribute("data-bg-color");
        input.style.backgroundColor = box.getAttribute("data-bg-color");
        box.style.color = "#fff";
      });

      box.addEventListener("dragleave", () => {
        box.style.backgroundColor = "#fff";
        input.style.backgroundColor = "#fff";
        box.style.color = "#000";
      });

      box.addEventListener("drop", () => {
        if (drag) {
          const oldBoxIndex = Array.from(boxes).findIndex((b) =>
            b.contains(drag)
          );
          container.appendChild(drag);
          box.style.backgroundColor = "#fff";
          input.style.backgroundColor = "#fff";
          box.style.color = "#000";

          // تحديث لون العنصر بناءً على الصندوق الذي تم إسقاطه فيه
          drag.style.backgroundColor = box.getAttribute("data-bg-color");

          // تحديث موقع العنصر في localStorage
          updateLocalStorage();
        }
      });
    });
  }

  function updateLocalStorage() {
    const allItems = [];
    boxes.forEach((box, boxIndex) => {
      const container = box.querySelector(".container");
      container.querySelectorAll(".item").forEach((item) => {
        allItems.push({ text: item.textContent, boxIndex });
      });
    });
    localStorage.setItem("items", JSON.stringify(allItems));
  }

  // التعامل مع تعديل اسم البوكس
  const editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const inputTitle = button.previousElementSibling;
      const toggleBtn = button;

      if (inputTitle.hasAttribute("readonly")) {
        inputTitle.removeAttribute("readonly");
        inputTitle.focus();
        toggleBtn.textContent = "👍";

        const saveChanges = () => {
          inputTitle.setAttribute("readonly", "");
          toggleBtn.textContent = "✏️";
          const boxIndex =
            Array.from(boxes).indexOf(inputTitle.closest(".box")) + 1;
          localStorage.setItem(`box${boxIndex}`, inputTitle.value);
          document.removeEventListener("click", saveChanges);
        };

        inputTitle.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            saveChanges();
            e.preventDefault(); // منع التصرف الافتراضي عند الضغط على Enter
          }
        });

        document.addEventListener("click", (event) => {
          if (
            !inputTitle.contains(event.target) &&
            !button.contains(event.target)
          ) {
            saveChanges();
          }
        });
      } else {
        inputTitle.setAttribute("readonly", "");
        toggleBtn.textContent = "✏️";
        const boxIndex =
          Array.from(boxes).indexOf(inputTitle.closest(".box")) + 1;
        localStorage.setItem(`box${boxIndex}`, inputTitle.value);
      }
    });
  });
});
